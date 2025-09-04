import { useState, useEffect, useRef, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import * as d3 from 'd3';
import LanguageSelector from './LanguageSelector';

const defaultCodeSnippets = {
    javascript: `function greet(name) {
  const message = 'Hello, ' + name;
  if (name === 'World') {
    console.log('Greeting the whole world!');
  }
  return message;
}

for (let i = 0; i < 2; i++) {
  const result = greet('World');
  console.log(result);
}`,
    python: `def greet(name):
    message = "Hello, " + name
    return message

result = greet("World")
print(result)`
};

export default function ExecutionVisualizer() {
    const [language, setLanguage] = useState('javascript');
    const [code, setCode] = useState(defaultCodeSnippets['javascript']);
    const [events, setEvents] = useState([]);
    const [logs, setLogs] = useState([]);
    const [output, setOutput] = useState('');
    const [currentStep, setCurrentStep] = useState(-1);
    const [error, setError] = useState('');
    const [isRunning, setIsRunning] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [playSpeed, setPlaySpeed] = useState(800);

    const svgRef = useRef(null);
    const editorRef = useRef(null);
    const monacoRef = useRef(null);
    const decorationsRef = useRef([]);
    const simulationRef = useRef();

    useEffect(() => {
        const stored = localStorage.getItem(`execvis_code_${language}`);
        setCode(stored || defaultCodeSnippets[language]);
    }, [language]);

    useEffect(() => {
        localStorage.setItem(`execvis_code_${language}`, code);
    }, [code, language]);

    // Advanced D3.js Flowchart Rendering
    useEffect(() => {
        const svg = d3.select(svgRef.current);
        const width = svg.node().parentElement.clientWidth;
        const height = 500;
        svg.attr('width', width).attr('height', height);

        if (events.length === 0 || !code) {
            svg.selectAll('*').remove();
            return;
        }

        const codeLines = code.split('\n');

        const nodes = events.map((event, i) => {
            const lineContent = codeLines[event.line - 1]?.trim() || `Line ${event.line}`;
            let type = event.event;
            if (event.event === 'line') {
                type = 'statement';
                if (/^function|=>/.test(lineContent)) type = 'function';
                if (/^if|else/.test(lineContent)) type = 'decision';
                if (/^for|while/.test(lineContent)) type = 'loop';
            }

            let label = `L${event.line}: ${lineContent.substring(0, 25)}${lineContent.length > 25 ? '...' : ''}`;
            if (event.event === 'call') label = `call ${event.func}`;
            if (event.event === 'return') label = `return ${event.func}`;

            return {
                id: i,
                line: event.line,
                label,
                type,
            };
        });

        const links = d3.range(nodes.length - 1).map(i => ({ source: nodes[i].id, target: nodes[i+1].id }));

        if (simulationRef.current) {
            simulationRef.current.stop();
        }

        svg.selectAll('*').remove();

        const container = svg.append('g');

        svg.call(d3.zoom().on('zoom', (event) => {
            container.attr('transform', event.transform);
        }));

        const link = container.append('g')
            .attr('stroke', '#999')
            .attr('stroke-opacity', 0.6)
            .selectAll('line')
            .data(links)
            .join('line')
            .attr('stroke-width', 2);

        const getNodeColor = (type) => {
            switch (type) {
                case 'function': return '#22c55e'; // green-500
                case 'decision': return '#f59e0b'; // amber-500
                case 'loop': return '#3b82f6'; // blue-500
                case 'call': return '#10b981'; // teal-500
                case 'return': return '#f97316'; // orange-500
                default: return '#6b7280'; // gray-500
            }
        };

        const node = container.append('g')
            .selectAll('g')
            .data(nodes)
            .join('g');

        node.append('rect')
            .attr('width', 200)
            .attr('height', 40)
            .attr('rx', 5)
            .attr('x', -100)
            .attr('y', -20)
            .attr('fill', d => getNodeColor(d.type))
            .attr('stroke', '#fff')
            .attr('stroke-width', 2);

        node.append('text')
            .attr('text-anchor', 'middle')
            .attr('dy', '0.35em')
            .attr('fill', 'white')
            .style('font-family', 'monospace')
            .style('font-size', '12px')
            .text(d => d.label);

        const drag = (simulation) => {
            function dragstarted(event, d) {
                if (!event.active) simulation.alphaTarget(0.3).restart();
                d.fx = d.x;
                d.fy = d.y;
            }
            function dragged(event, d) {
                d.fx = event.x;
                d.fy = event.y;
            }
            function dragended(event, d) {
                if (!event.active) simulation.alphaTarget(0);
                d.fx = null;
                d.fy = null;
            }
            return d3.drag().on("start", dragstarted).on("drag", dragged).on("end", dragended);
        }

        node.call(drag(simulationRef.current));

        simulationRef.current = d3.forceSimulation(nodes)
            .force('link', d3.forceLink(links).id(d => d.id).distance(120))
            .force('charge', d3.forceManyBody().strength(-300))
            .force('center', d3.forceCenter(width / 2, height / 2))
            .on('tick', () => {
                link
                    .attr('x1', d => d.source.x)
                    .attr('y1', d => d.source.y)
                    .attr('x2', d => d.target.x)
                    .attr('y2', d => d.target.y);
                node.attr('transform', d => `translate(${d.x}, ${d.y})`);
            });
    }, [events, code]);

    // Update node styles based on current step
    useEffect(() => {
        d3.select(svgRef.current).selectAll('rect')
            .transition()
            .duration(300)
            .attr('stroke', (d, i) => i === currentStep ? '#facc15' : '#fff')
            .attr('stroke-width', (d, i) => i === currentStep ? 4 : 2)
            .style('filter', (d, i) => i === currentStep ? 'drop-shadow(0 0 8px #facc15)' : 'drop-shadow(0 4px 6px rgb(0 0 0 / 0.1))');
    }, [currentStep]);


    useEffect(() => {
        if (!isPlaying) return;
        if (currentStep >= events.length - 1) {
            setIsPlaying(false);
            return;
        }
        const id = setTimeout(() => {
            setCurrentStep((s) => Math.min(events.length - 1, s + 1));
        }, playSpeed);
        return () => clearTimeout(id);
    }, [isPlaying, currentStep, playSpeed, events.length]);

    useEffect(() => {
        if (!editorRef.current || !monacoRef.current) return;
        const monaco = monacoRef.current;
        const line = events[currentStep]?.line;
        decorationsRef.current = editorRef.current.deltaDecorations(
            decorationsRef.current,
            line
                ? [{
                    range: new monaco.Range(line, 1, line, 1),
                    options: { isWholeLine: true, className: 'highlight-line' },
                }]
                : []
        );
    }, [currentStep, events]);

    const runCode = useCallback(async () => {
        setError('');
        setEvents([]);
        setLogs([]);
        setOutput('');
        setCurrentStep(-1);
        setIsRunning(true);
        setIsPlaying(false);
        try {
            const res = await fetch('/api/execute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ language, code }),
            });
            const data = await res.json();

            if (!res.ok || data.error) {
                const errorMsg = data.message || data.events?.find((e) => e.event === 'error')?.message || 'Execution error';
                setError(errorMsg);
                return;
            }

            const ev = data.events || [];
            const stepEvents = ev.filter((e) => e.event !== 'log');
            const logEvents = ev.filter((e) => e.event === 'log');
            setEvents(stepEvents);
            setLogs(logEvents);
            setOutput(data.output || '');
            setCurrentStep(stepEvents.length > 0 ? 0 : -1);
        } catch (e) {
            setError('Network error');
        } finally {
            setIsRunning(false);
        }
    }, [language, code]);

    useEffect(() => {
        const handler = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                runCode();
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [runCode]);

    const resetCode = () => {
        setCode(defaultCodeSnippets[language]);
        setEvents([]);
        setLogs([]);
        setOutput('');
        setCurrentStep(-1);
        setError('');
        localStorage.removeItem(`execvis_code_${language}`);
    };

    return (
        <div className="space-y-4">
            <LanguageSelector
                selectedLanguage={language}
                setSelectedLanguage={setLanguage}
                languages={['javascript', 'python']}
            />
            <Editor
                height="40vh"
                language={language}
                value={code}
                onMount={(editor, monaco) => {
                    editorRef.current = editor;
                    monacoRef.current = monaco;
                }}
                onChange={(value) => setCode(value ?? '')}
            />
            <div className="flex gap-2">
                <button
                    onClick={runCode}
                    disabled={isRunning}
                    className={`px-4 py-2 rounded text-white ${ isRunning ? 'bg-purple-400 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700' }`}
                >
                    {isRunning ? 'Running...' : 'Run'}
                </button>
                <button
                    onClick={resetCode}
                    className="px-4 py-2 rounded bg-gray-500 text-white hover:bg-gray-600"
                    disabled={isRunning}
                >
                    Reset Code
                </button>
            </div>
            {error && <div className="text-red-500">{error}</div>}
            {events.length > 0 && (
                <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                        <button onClick={() => { setIsPlaying(false); setCurrentStep((s) => Math.max(0, s - 1)); }} disabled={currentStep <= 0} className="px-3 py-1 rounded bg-gray-300 disabled:opacity-50">Prev</button>
                        <button onClick={() => { setIsPlaying((p) => { if (!p && currentStep < 0 && events.length > 0) setCurrentStep(0); return !p; }); }} className="px-3 py-1 rounded bg-gray-300">{isPlaying ? 'Pause' : 'Play'}</button>
                        <button onClick={() => { setIsPlaying(false); setCurrentStep((s) => Math.min(events.length - 1, s + 1)); }} disabled={currentStep >= events.length - 1} className="px-3 py-1 rounded bg-gray-300 disabled:opacity-50">Next</button>
                        <button onClick={() => { setIsPlaying(false); setCurrentStep(0); }} className="px-3 py-1 rounded bg-gray-300">Reset</button>
                        <div className="flex items-center space-x-1 ml-4">
                            <label className="text-sm">Speed</label>
                            <input type="range" min="100" max="2000" step="100" value={playSpeed} onChange={(e) => setPlaySpeed(Number(e.target.value))} className="w-32" />
                            <span className="text-xs">{playSpeed}ms</span>
                        </div>
                    </div>
                    <input type="range" min={0} max={events.length - 1} value={currentStep} onChange={(e) => { setIsPlaying(false); setCurrentStep(Number(e.target.value)); }} className="w-full" />
                </div>
            )}
            <div className="relative p-4 bg-white dark:bg-gray-800 rounded shadow min-h-[550px] space-y-2 overflow-hidden">
                {events.length === 0 && !isRunning && (
                    <p className="text-gray-500">Run the code to see the execution flowchart.</p>
                )}
                {currentStep >= 0 && events[currentStep] && (
                    <div className="mb-4">
                        <p className="font-semibold">Step {currentStep + 1} of {events.length} ({events[currentStep].event} at line {events[currentStep].line})</p>
                        <h4 className="font-semibold mt-2">Local Variables:</h4>
                        <pre className="text-sm bg-gray-100 dark:bg-gray-700 p-2 rounded max-h-24 overflow-auto">
                            <code>{JSON.stringify(events[currentStep].locals || {}, null, 2)}</code>
                        </pre>
                        {events[currentStep].stack && (
                            <>
                                <h4 className="font-semibold mt-2">Call Stack:</h4>
                                <pre className="text-sm bg-gray-100 dark:bg-gray-700 p-2 rounded max-h-24 overflow-auto">
                                    <code>{events[currentStep].stack.join(' -> ')}</code>
                                </pre>
                            </>
                        )}
                    </div>
                )}
                <svg ref={svgRef}></svg>
            </div>
            {(output || logs.length > 0) && (
                <div className="p-4 bg-white dark:bg-gray-800 rounded shadow space-y-2">
                    {output && (
                        <div>
                            <p className="font-semibold">Output</p>
                            <pre className="text-sm bg-gray-100 p-2 rounded whitespace-pre-wrap"><code>{output}</code></pre>
                        </div>
                    )}
                    {logs.length > 0 && (
                        <div>
                            <p className="font-semibold">Console</p>
                            <pre className="text-sm bg-gray-100 p-2 rounded whitespace-pre-wrap">
                                {logs.map((l, i) => (<div key={i}>{l.value}</div>))}
                            </pre>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
