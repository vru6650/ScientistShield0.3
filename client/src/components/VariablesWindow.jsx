import PropTypes from 'prop-types';

export default function VariablesWindow({ variables, prevVariables }) {
    const entries = Object.entries(variables);
    return (
        <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded overflow-auto max-h-64">
            <h4 className="font-semibold mb-2">Variables</h4>
            {entries.length === 0 ? (
                <p className="text-sm text-gray-500">No active variables</p>
            ) : (
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-left">
                            <th className="pr-2">Name</th>
                            <th>Value</th>
                        </tr>
                    </thead>
                    <tbody>
                        {entries.map(([name, value]) => {
                            const changed = JSON.stringify(prevVariables[name]) !== JSON.stringify(value);
                            return (
                                <tr key={name} className={changed ? 'bg-yellow-200 dark:bg-yellow-900' : ''}>
                                    <td className="pr-2 font-mono">{name}</td>
                                    <td className="font-mono">{JSON.stringify(value)}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            )}
        </div>
    );
}

VariablesWindow.propTypes = {
    variables: PropTypes.object.isRequired,
    prevVariables: PropTypes.object,
};

VariablesWindow.defaultProps = {
    prevVariables: {},
};
