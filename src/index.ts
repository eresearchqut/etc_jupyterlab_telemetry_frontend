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
  let awsAPIGatewayWrapper: AWSAPIGatewayWrapper;
  if (baseUrl.includes('jupyter.dev.qutanalytics.io')) {
    awsAPIGatewayWrapper = new AWSAPIGatewayWrapper({
      url: 'https://telemetry.dev.qutanalytics.io',
      bucket: 'jupyterhub-telementry-dev-collector',
      path: '2022s2'
    });
  } else if (baseUrl.includes('jupyter.qutanalytics.io')) {
    awsAPIGatewayWrapper = new AWSAPIGatewayWrapper({
      url: 'https://telmetry.qutanalytics.io',
      bucket: 'jupyterhub-telementry-prod-collector',
      path: '2022s2'
    });
  } else {
    return console.log;
  }

  let remoteObserve = async () => {
    try {
      let timestamp: number = Date.now();
      //let response: Response = await awsAPIGatewayWrapper.requestAsync(["This request was made by AWSAPIGatewayWrapper#requestAsync.", timestamp]);
      await awsAPIGatewayWrapper.requestAsync(["This request was made by AWSAPIGatewayWrapper#requestAsync.", timestamp]);
    }
    catch (e) {
      console.error(e);
    }
  };

  return remoteObserve;
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

