const vscode = require('vscode');

function activate(context) {
    let switchCompilerDisposable = vscode.commands.registerCommand('extension.switchCompiler', async () => {
        const compilers = vscode.workspace.getConfiguration('tzRuntime').get('compilers');
        const selectedCompiler = await vscode.window.showQuickPick(compilers, {
            placeHolder: 'Select a compiler',
        });

        if (selectedCompiler) {
            vscode.workspace.getConfiguration().update('C_Cpp.default.compilerPath', selectedCompiler, vscode.ConfigurationTarget.Workspace);
            vscode.window.showInformationMessage(`Switched to ${selectedCompiler}`);
        }
    });

    let compileWithGccDisposable = vscode.commands.registerCommand('extension.compileWithGcc', () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No file is currently open.');
            return;
        }

        const document = editor.document;
        const filePath = document.fileName;
        const gccPath = vscode.workspace.getConfiguration('tzRuntime').get('gccPath');

        const outputChannel = vscode.window.createOutputChannel('GCC');
        outputChannel.show(true);

        outputChannel.appendLine(`Compiling ${filePath} with GCC...`);

        cp.exec(`${gccPath} ${filePath} -o ${filePath}.out`, (err, stdout, stderr) => {
            if (err) {
                outputChannel.appendLine(`Error: ${stderr}`);
                vscode.window.showErrorMessage('Compilation failed. See output for details.');
                return;
            }
            outputChannel.appendLine(`Output: ${stdout}`);
            vscode.window.showInformationMessage('Compilation successful!');
        });
    });

    context.subscriptions.push(switchCompilerDisposable);
    context.subscriptions.push(compileWithGccDisposable);

    // Register the view provider
    const provider = new TzRuntimeProvider(context);
    vscode.window.registerTreeDataProvider('tzRuntimeView', provider);

    // Ensure the C/C++ extension is activated
    vscode.extensions.getExtension('ms-vscode.cpptools').activate().then(() => {
        vscode.window.showInformationMessage('C/C++ extension activated');
    });
}

class TzRuntimeProvider {
    constructor(context) {
        this.context = context;
    }

    getTreeItem(element) {
        return element;
    }

    getChildren() {
        const compilers = vscode.workspace.getConfiguration('tzRuntime').get('compilers');
        return compilers.map(compiler => {
            let item = new vscode.TreeItem(compiler);
            item.command = {
                command: 'extension.openWebview',
                title: '',
                arguments: [compiler]
            };
            return item;
        });
    }
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
};

// Register the command to open a Webview
vscode.commands.registerCommand('extension.openWebview', (compiler) => {
    const panel = vscode.window.createWebviewPanel(
        'compilerInfo',
        `Compiler: ${compiler}`,
        vscode.ViewColumn.One,
        {}
    );

    panel.webview.html = getWebviewContent(compiler);
});

function getWebviewContent(compiler) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>数据回放配置</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f0f4f8;
            color: #333;
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
        }
        .container {
            background-color: #fff;
            border-radius: 12px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            padding: 30px;
            max-width: 600px;
            width: 100%;
        }
        h2 {
            text-align: center;
            color: #0078d4;
            margin-bottom: 20px;
        }
        .form-group {
            margin-bottom: 20px;
        }
        .form-group label {
            display: block;
            font-weight: bold;
            margin-bottom: 8px;
        }
        .form-group input, .form-group select {
            width: 100%;
            padding: 10px;
            border: 1px solid #ccc;
            border-radius: 8px;
            box-sizing: border-box;
        }
        .buttons {
            display: flex;
            justify-content: space-between;
        }
        .buttons button {
            padding: 12px 20px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
            flex: 1;
            margin: 0 5px;
            transition: background-color 0.3s ease, transform 0.3s ease;
        }
        .buttons button.start {
            background-color: #28a745;
            color: white;
        }
        .buttons button.pause, .buttons button.stop {
            background-color: #dc3545;
            color: white;
        }
        .buttons button.fast-forward, .buttons button.rewind {
            background-color: #007bff;
            color: white;
        }
        .buttons button:hover {
            transform: translateY(-2px);
        }
        .buttons button:active {
            transform: translateY(0);
        }
        #field-selection label {
            display: inline-block;
            margin-right: 10px;
            margin-bottom: 10px;
        }
        #field-selection input[type="checkbox"] {
            margin-right: 5px;
        }
    </style>
</head>
<body>

<div class="container">
    <h2>数据回放配置</h2>
    <div class="form-group">
        <label for="start-time">起始时间</label>
        <input type="datetime-local" id="start-time">
    </div>
    <div class="form-group">
        <label for="end-time">结束时间</label>
        <input type="datetime-local" id="end-time">
    </div>
    <div class="form-group">
        <label for="playback-speed">回放速度</label>
        <select id="playback-speed">
            <option value="1x">实时 (1x)</option>
            <option value="2x">加速 (2x)</option>
            <option value="5x">加速 (5x)</option>
            <option value="10x">加速 (10x)</option>
            <option value="0.5x">减速 (0.5x)</option>
        </select>
    </div>
    <div class="form-group">
        <label for="input-source">输入源表名</label>
        <select id="input-source" onchange="updateFields()">
            <option value="table1">表1</option>
            <option value="table2">表2</option>
            <option value="table3">表3</option>
        </select>
    </div>
    <div class="form-group">
        <label for="output-destination">输出位置</label>
        <input type="text" id="output-destination" placeholder="例如：http://example.com/output">
    </div>

    <h3>数据源字段选择</h3>
    <div id="field-selection">
        <!-- 动态生成复选框 -->
    </div>

    <div class="buttons">
        <button class="start" onclick="startReplay()">开始</button>
        <button class="pause" onclick="pauseReplay()">暂停</button>
        <button class="stop" onclick="stopReplay()">停止</button>
        <button class="fast-forward" onclick="fastForward()">快进</button>
        <button class="rewind" onclick="rewind()">倒回</button>
    </div>
</div>
</body>
</html>
    `;
}
