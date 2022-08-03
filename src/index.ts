import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import {
  ServerConnection
} from '@jupyterlab/services';

import {
  INotebookTracker,
  NotebookPanel
} from '@jupyterlab/notebook';

import {
  IETCJupyterLabTelemetryLibraryFactory
} from '@educational-technology-collective/etc_jupyterlab_telemetry_library'

import { AWSAPIGatewayWrapper } from './api';


function getTelemetryHandler(baseUrl: string) {
  let handler;

  if (baseUrl.includes('localhost')) {
    handler = console.log;
  } else {
    let telemUrl = baseUrl.replace('jupyter', 'telemetry');
    let awsAPIGatewayWrapper: AWSAPIGatewayWrapper = new AWSAPIGatewayWrapper({
      url: telemUrl,
      bucket: 'telementry',
      path: "2022s2",
    });
    let remoteObserve = async () => {
      try {
        let timestamp: number = Date.now();
        let response: Response = await awsAPIGatewayWrapper.requestAsync(["This request was made by AWSAPIGatewayWrapper#requestAsync.", timestamp]);
        console.log(response);
      }
      catch (e) {
        console.error(e);
      }
    };

    handler = remoteObserve;
  }

  return handler;
}

const plugin: JupyterFrontEndPlugin<void> = {
  id: 'etc-frontend:plugin',
  autoStart: true,
  requires: [
    INotebookTracker,
    IETCJupyterLabTelemetryLibraryFactory
  ],
  activate: (
    app: JupyterFrontEnd,
    notebookTracker: INotebookTracker,
    etcJupyterLabTelemetryLibraryFactory: IETCJupyterLabTelemetryLibraryFactory
  ) => {
    (async () => {
      await app.started;

      const settings = ServerConnection.makeSettings();
      const baseUrl = settings.baseUrl;
      let telemetryHandler = getTelemetryHandler(baseUrl);

      try {
        notebookTracker.widgetAdded.connect(
          (sender: INotebookTracker, notebookPanel: NotebookPanel) => {
            //  Handlers must be attached immediately in order to detect early events, hence we do not want to await the appearance of the Notebook.

            let etcJupyterLabTelemetryLibrary =
              etcJupyterLabTelemetryLibraryFactory.create({ notebookPanel });

            etcJupyterLabTelemetryLibrary.notebookClipboardEvent.notebookClipboardCopied.connect(
	      telemetryHandler 
            );
            etcJupyterLabTelemetryLibrary.notebookClipboardEvent.notebookClipboardCut.connect(
	      telemetryHandler 
            );
            etcJupyterLabTelemetryLibrary.notebookClipboardEvent.notebookClipboardPasted.connect(
	      telemetryHandler 
            );

            etcJupyterLabTelemetryLibrary.notebookVisibilityEvent.notebookVisible.connect(
	      telemetryHandler 
            );
            etcJupyterLabTelemetryLibrary.notebookVisibilityEvent.notebookHidden.connect(
	      telemetryHandler 
            );

            etcJupyterLabTelemetryLibrary.notebookOpenEvent.notebookOpened.connect(
	      telemetryHandler 
            );
            etcJupyterLabTelemetryLibrary.notebookCloseEvent.notebookClosed.connect(
	      telemetryHandler 
            );
            etcJupyterLabTelemetryLibrary.notebookSaveEvent.notebookSaved.connect(
	      telemetryHandler 
            );
            etcJupyterLabTelemetryLibrary.notebookScrollEvent.notebookScrolled.connect(
	      telemetryHandler 
            );

            etcJupyterLabTelemetryLibrary.activeCellChangeEvent.activeCellChanged.connect(
	      telemetryHandler 
            );
            etcJupyterLabTelemetryLibrary.cellAddEvent.cellAdded.connect(
	      telemetryHandler 
            );
            etcJupyterLabTelemetryLibrary.cellRemoveEvent.cellRemoved.connect(
	      telemetryHandler 
            );
            etcJupyterLabTelemetryLibrary.cellExecutionEvent.cellExecuted.connect(
	      telemetryHandler 
            );
            etcJupyterLabTelemetryLibrary.cellErrorEvent.cellErrored.connect(
	      telemetryHandler 
            );
          }
        );
      } catch (e) {
        console.error(e);
      }
    })();
  }
};

export default plugin;

