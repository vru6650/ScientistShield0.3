import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ExecutionVisualizer from '../ExecutionVisualizer';

// Mock the Monaco editor to a simple textarea for tests
jest.mock('@monaco-editor/react', () => ({
    __esModule: true,
    default: ({ value, onChange }) => (
        <textarea data-testid="editor" value={value} onChange={(e) => onChange(e.target.value)} />
    ),
}));

// Minimal mock for d3 to avoid DOM manipulation during tests
jest.mock('d3', () => ({
    select: () => ({
        selectAll: () => ({ remove: jest.fn() }),
    }),
}));

describe('ExecutionVisualizer', () => {
    beforeEach(() => {
        localStorage.clear();
        global.fetch = undefined;
    });

    test('reset button restores default code snippet', () => {
        render(<ExecutionVisualizer />);

        const editor = screen.getByTestId('editor');
        fireEvent.change(editor, { target: { value: 'console.log("test")' } });
        expect(editor.value).toBe('console.log("test")');

        const resetBtn = screen.getByText('Reset Code');
        fireEvent.click(resetBtn);

        expect(editor.value).toContain('function greet');
    });

    test('shows expression evaluation step', async () => {
        global.fetch = jest.fn(() =>
            Promise.resolve({
                ok: true,
                json: () =>
                    Promise.resolve({
                        events: [
                            { event: 'expr', line: 1, expr: '2+2', value: '4', locals: {} },
                        ],
                        output: '',
                        error: false,
                    }),
            })
        );
        render(<ExecutionVisualizer />);

        const runBtn = screen.getByText('Run');
        fireEvent.click(runBtn);

        await waitFor(() => {
            expect(screen.getByTestId('expr-eval').textContent).toContain('2+2');
        });
    });
});