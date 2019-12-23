'use strict';
import * as vscode from 'vscode';
import * as Configuration from "./Configuration";
import ignore from 'ignore';

const impor = require('impor')(__dirname);

const LESS_EXT = ".less";
const SASS_EXT = ".sass";
const SCSS_EXT = ".scss";
const TS_EXT = ".ts";
const CSS_EXT = ".css";
const JS_EXT = ".js";
const COMPILE_COMMAND = "easyCompile.compile";
const MINIFY_COMMAND = "easyCompile.minify";
const MINIFYDIR_COMMAND = "easyCompile.minifydir";

let DiagnosticCollection: vscode.DiagnosticCollection;

export function activate(context: vscode.ExtensionContext) {

    DiagnosticCollection = vscode.languages.createDiagnosticCollection();
    let runCommand = function (type: string, filePath: string){
        filePath = Configuration.formatPath(filePath);
        let organise;
        if(type == LESS_EXT){
            const LessCompiler = impor("./compiles/less/CompileLessCommand") as typeof import('./compiles/less/CompileLessCommand');
            organise = new LessCompiler.CompileLessCommand(filePath, DiagnosticCollection);
        }else if(type == SASS_EXT){
            const SassCompiler = impor("./compiles/sass/CompileSassCommand") as typeof import('./compiles/sass/CompileSassCommand');
            organise = new SassCompiler.CompileSassCommand(filePath, DiagnosticCollection);
        }else if(type == TS_EXT){
            const TsCompiler = impor("./compiles/typescript/CompileTsCommand") as typeof import('./compiles/typescript/CompileTsCommand');
            organise = new TsCompiler.CompileTsCommand(filePath, DiagnosticCollection);
        }else if(type == CSS_EXT){
            const CssCompiler = impor("./minify/css/MinifyCssCommand") as typeof import("./minify/css/MinifyCssCommand");
            organise = new CssCompiler.MinifyCssCommand(filePath, DiagnosticCollection);
        }else if(type == JS_EXT){
            const JsCompiler = impor("./minify/js/MinifyJsCommand") as typeof import('./minify/js/MinifyJsCommand');
            organise = new JsCompiler.MinifyJsCommand(filePath, DiagnosticCollection, undefined, undefined);
        }
        organise.execute();
    }

    let runCompileCommand = function(filePath: string){
        let compileOptions = Configuration.getGlobalOptions(filePath);
        if(filePath.endsWith(LESS_EXT)){
            if(typeof compileOptions.less === "undefined" || compileOptions.less === true){
                runCommand(LESS_EXT, filePath);
            }
        }
        else if(filePath.endsWith(TS_EXT)){
            if(typeof compileOptions.typescript === "undefined" || compileOptions.typescript === true){
                runCommand(TS_EXT, filePath);
            }
        }
        else if(filePath.endsWith(SASS_EXT) || filePath.endsWith(SCSS_EXT)){
            if(typeof compileOptions.sass === "undefined" || compileOptions.sass === true){
                runCommand(SASS_EXT, filePath);
            }
        }
        else
        {
            vscode.window.showWarningMessage("This command not work for this file.");
        }
    }

    // compile command
    let compileCommand = vscode.commands.registerCommand(COMPILE_COMMAND, (fileUri?:vscode.Uri) =>
    {
        let filePath: string | undefined;
        if(fileUri){
            filePath = fileUri.path;
        }else{
            let activeEditor = vscode.window.activeTextEditor;
            if (activeEditor){
                let document: vscode.TextDocument = activeEditor.document;
                if (document){
                    filePath = document.fileName;
                }
            }
        }
        
        if (filePath)
        {
            runCompileCommand(filePath);
        }
        else
        {
            vscode.window.showInformationMessage("This command not available for this file.");
        }
    });

    // minify command
    let minifyCommand = vscode.commands.registerCommand(MINIFY_COMMAND, (fileUri?:vscode.Uri) =>
    {
        let filePath: string | undefined;
        if(fileUri){
            filePath = fileUri.path;
        }else{
            let activeEditor = vscode.window.activeTextEditor;
            if (activeEditor){
                let document: vscode.TextDocument = activeEditor.document;
                if (document){
                    filePath = document.fileName;
                }
            }
        }

        if (filePath)
        {
            if(filePath.endsWith(JS_EXT)){
                runCommand(JS_EXT, filePath);
            }
            else if(filePath.endsWith(CSS_EXT)){
                runCommand(CSS_EXT, filePath);
            }
            else
            {
                vscode.window.showWarningMessage("This command not work for this file.");
            }
        }
        else
        {
            vscode.window.showInformationMessage("This command only available after file opened.");
        }
    });

    let minifydirCommand = vscode.commands.registerCommand(MINIFYDIR_COMMAND, () =>
    {
        vscode.window.showInformationMessage("Not implement.");
    });
    
    // automatically compile/minfy on save
    let didSaveEvent = vscode.workspace.onDidSaveTextDocument((document: vscode.TextDocument) =>
    {
        let filePath: string | undefined;
        let activeEditor = vscode.window.activeTextEditor;
        if (activeEditor){
            let document: vscode.TextDocument = activeEditor.document;
            if (document){
                filePath = document.fileName;
            }
        }

        if(filePath === document.fileName){
            let compileOptions = Configuration.getGlobalOptions(filePath);
            if(compileOptions.ignore){
                const ig = ignore().add(compileOptions.ignore);
                if(ig.ignores(filePath)) return;
            }
            if (filePath.endsWith(LESS_EXT) || filePath.endsWith(TS_EXT) || filePath.endsWith(SASS_EXT) || filePath.endsWith(SCSS_EXT))
            {
                runCompileCommand(filePath);
            }else if (filePath.endsWith(JS_EXT) && compileOptions.minifyJsOnSave)
            {
                runCommand(JS_EXT, filePath);
            }else if (filePath.endsWith(CSS_EXT) && compileOptions.minifyCssOnSave)
            {
                runCommand(CSS_EXT, filePath);
            }
        }
    });
    
    // dismiss less/sass/scss errors on file close
    let didCloseEvent = vscode.workspace.onDidCloseTextDocument((document: vscode.TextDocument) =>
    {
        if (document.fileName.endsWith(LESS_EXT) || document.fileName.endsWith(SASS_EXT) || document.fileName.endsWith(SCSS_EXT))
        {
            DiagnosticCollection.delete(document.uri);
        }
    })

    context.subscriptions.push(compileCommand);
    context.subscriptions.push(minifyCommand);
    context.subscriptions.push(minifydirCommand);
    context.subscriptions.push(didSaveEvent);
    context.subscriptions.push(didCloseEvent);
}

// this method is called when your extension is deactivated
export function deactivate()
{
    if (DiagnosticCollection)
    {
        DiagnosticCollection.dispose();
    }
}
