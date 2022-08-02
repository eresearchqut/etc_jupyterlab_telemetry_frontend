import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import {
  INotebookTracker,
  NotebookPanel
} from '@jupyterlab/notebook';

import {
  IETCJupyterLabTelemetryLibraryFactory
} from '@educational-technology-collective/etc_jupyterlab_telemetry_library'

import { AWSAPIGatewayWrapper } from './api';

let awsAPIGatewayWrapper: AWSAPIGatewayWrapper = new AWSAPIGatewayWrapper({
  url: "https://telemetry.dev.qutanalytics.io",
  bucket: 'jupyterhub-telementry-dev',
  path: "iab303",
});

let remoteObserve = async () => {
  try {
    let timestamp: number = Date.now();
    let response: Response = await awsAPIGatewayWrapper.requestAsync(["This request was made by AWSAPIGatewayWrapper#requestAsync.", timestamp]);
    console.log(response)
  }
  catch (e) {
    console.error(e);
  }
};

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

      try {
        notebookTracker.widgetAdded.connect(
          (sender: INotebookTracker, notebookPanel: NotebookPanel) => {
            //  Handlers must be attached immediately in order to detect early events, hence we do not want to await the appearance of the Notebook.

            let etcJupyterLabTelemetryLibrary =
              etcJupyterLabTelemetryLibraryFactory.create({ notebookPanel });

            etcJupyterLabTelemetryLibrary.notebookClipboardEvent.notebookClipboardCopied.connect(
              remoteObserve
            );
            etcJupyterLabTelemetryLibrary.notebookClipboardEvent.notebookClipboardCut.connect(
              remoteObserve
            );
            etcJupyterLabTelemetryLibrary.notebookClipboardEvent.notebookClipboardPasted.connect(
              remoteObserve
            );

            etcJupyterLabTelemetryLibrary.notebookVisibilityEvent.notebookVisible.connect(
              remoteObserve
            );
            etcJupyterLabTelemetryLibrary.notebookVisibilityEvent.notebookHidden.connect(
              remoteObserve
            );

            etcJupyterLabTelemetryLibrary.notebookOpenEvent.notebookOpened.connect(
              remoteObserve
            );
            etcJupyterLabTelemetryLibrary.notebookCloseEvent.notebookClosed.connect(
              remoteObserve
            );
            etcJupyterLabTelemetryLibrary.notebookSaveEvent.notebookSaved.connect(
              remoteObserve
            );
            etcJupyterLabTelemetryLibrary.notebookScrollEvent.notebookScrolled.connect(
              remoteObserve
            );

            etcJupyterLabTelemetryLibrary.activeCellChangeEvent.activeCellChanged.connect(
              remoteObserve
            );
            etcJupyterLabTelemetryLibrary.cellAddEvent.cellAdded.connect(
              remoteObserve
            );
            etcJupyterLabTelemetryLibrary.cellRemoveEvent.cellRemoved.connect(
              remoteObserve
            );
            etcJupyterLabTelemetryLibrary.cellExecutionEvent.cellExecuted.connect(
              remoteObserve
            );
            etcJupyterLabTelemetryLibrary.cellErrorEvent.cellErrored.connect(
              remoteObserve
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

