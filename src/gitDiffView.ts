import * as path from 'path';
import * as vscode from 'vscode';
import { html } from 'diff2html';
import { Disposable, toDisposable } from './utils/disposable';
/**
 * Manages the Git Graph View.
 */
export class GitDiffView extends Disposable {
	public static currentPanel: GitDiffView | undefined;

	private readonly panel: vscode.WebviewPanel;
	private readonly extensionPath: string;
	private isPanelVisible: boolean = true;

	public static createOrShow(
		extensionPath: string,
		diffContent: string,
		column: vscode.ViewColumn = vscode.ViewColumn.Beside
	) {
		if (
			GitDiffView.currentPanel
		) {
			GitDiffView.currentPanel.panel.webview.html = GitDiffView.currentPanel.getHtmlForWebview(diffContent);
			GitDiffView.currentPanel.panel.reveal(column);
		} else {
			// If Git Graph panel doesn't already exist
			GitDiffView.currentPanel = new GitDiffView(
				extensionPath,
				diffContent,
				column
			);
		}
	}

	private constructor(
		extensionPath: string,
		diffContent: string,
		column: vscode.ViewColumn
	) {
		super();
		this.extensionPath = extensionPath;
		this.panel = vscode.window.createWebviewPanel(
			'Diff Viewer',
			'Diff Viewer',
			column,
			{
				enableScripts: true,
				localResourceRoots: [
					vscode.Uri.file(path.join(extensionPath, 'media'))
				]
			}
		);
		this.panel.webview.html = this.getHtmlForWebview(diffContent);

		this.registerDisposables(
			// Dispose Git Graph View resources when disposed
			toDisposable(() => {
				GitDiffView.currentPanel = undefined;
			}),

			// Dispose this Git Graph View when the Webview Panel is disposed
			this.panel.onDidDispose(() => this.dispose()),

			// Register a callback that is called when the view is shown or hidden
			this.panel.onDidChangeViewState(() => {
				if (this.panel.visible !== this.isPanelVisible) {
					this.isPanelVisible = this.panel.visible;
				}
			}),
			// Dispose the Webview Panel when disposed
			this.panel
		);
	}

	/**
	 * Get the HTML document to be loaded in the Webview.
	 * @returns The HTML.
	 */
	private getHtmlForWebview(diffContent: string): string {
		return /* html */ `
		<!DOCTYPE html>
		<html lang="en" id="diff-2-html">
		<head>
			<title></title>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
			<link rel="stylesheet" type="text/css" href="${this.getMediaUri('out.min.css')}">
			<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.2.0/styles/github.min.css" />
			<link rel="stylesheet" type="text/css" href="https://cdn.jsdelivr.net/npm/diff2html/bundles/css/diff2html.min.css" />
			<script type="text/javascript" src="https://cdn.jsdelivr.net/npm/diff2html/bundles/js/diff2html-ui.min.js"></script>
		</head>
		<body>
			<div id="app"></div>
			${html(diffContent)}
		</body>
		</html>`;
	}

	/* URI Manipulation Methods */

	/**
	 * Get a WebviewUri for a media file included in the extension.
	 * @param file The file name in the `media` directory.
	 * @returns The WebviewUri.
	 */
	private getMediaUri(file: string) {
		return this.panel.webview.asWebviewUri(this.getUri('media', file));
	}

	/**
	 * Get a File Uri for a file included in the extension.
	 * @param pathComps The path components relative to the root directory of the extension.
	 * @returns The File Uri.
	 */
	private getUri(...pathComps: string[]) {
		return vscode.Uri.file(path.join(this.extensionPath, ...pathComps));
	}
}
