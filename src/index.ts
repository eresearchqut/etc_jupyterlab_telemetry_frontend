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
} from '@educational-technology-collective/etc_jupyterlab_telemetry_library';
import {
    IETCJupyterLabNotebookStateProvider
} from "@educational-technology-collective/etc_jupyterlab_notebook_state_provider";
import {
    AWSAPIGatewayWrapper
} from './api';

function getTelemetryHandler(baseUrl: string, stateProvider: IETCJupyterLabNotebookStateProvider) {
    let awsAPIGatewayWrapper: AWSAPIGatewayWrapper;
    if (baseUrl.includes('jupyter.dev.qutanalytics.io')) {
        awsAPIGatewayWrapper = new AWSAPIGatewayWrapper({
            url: 'https://telemetry.dev.qutanalytics.io',
            bucket: 'jupyterhub-telementry-dev-collector',
            path: '2024s1'
        });
    } else if (baseUrl.includes('jupyter.qutanalytics.io')) {
        awsAPIGatewayWrapper = new AWSAPIGatewayWrapper({
            url: 'https://telemetry.qutanalytics.io',
            bucket: 'jupyterhub-telementry-prod-collector',
            path: '2024s1'
        });
    }
    let remoteObserve = async (sender: any, args: any) => {
        try {
            let notebookPanel = args.notebookPanel;
            let notebookState = stateProvider.getNotebookState({
                notebookPanel
            });
            delete args.notebookPanel;
            // override user's environment variables
            if (args.environ) {
                let environ = {
                    "hostname": args.environ.HOSTNAME,
                    "user": args.environ.JUPYTERHUB_USER,
                    "pwd": args.environ.PWD
                };
                args.environ = environ;
            }
            if (args.eventName == 'open_notebook') {
                delete args.meta;
            }
            let data = {
                "event": args,
                "state": notebookState
            };
            if (awsAPIGatewayWrapper) {
                await awsAPIGatewayWrapper.requestAsync(data);
            } else {
                console.log(data);
            }
        } catch (e) {
            console.error(e);
        }
    };
    return remoteObserve;
}

const plugin: JupyterFrontEndPlugin < void > = {
    id: 'etc-frontend:plugin',
    autoStart: true,
    requires: [
        INotebookTracker,
        IETCJupyterLabTelemetryLibraryFactory,
        IETCJupyterLabNotebookStateProvider
    ],
    activate: (app: JupyterFrontEnd,
               notebookTracker: INotebookTracker,
               etcJupyterLabTelemetryLibraryFactory: IETCJupyterLabTelemetryLibraryFactory,
               etcJupyterLabNotebookStateProvider: IETCJupyterLabNotebookStateProvider) => {
        (async () => {
            await app.started;
            const settings = ServerConnection.makeSettings();
            const baseUrl = settings.baseUrl;
            let telemetryHandler = getTelemetryHandler(baseUrl, etcJupyterLabNotebookStateProvider);
            try {
                notebookTracker.widgetAdded.connect(
                    (async (sender: INotebookTracker, notebookPanel: NotebookPanel) => {
                        etcJupyterLabNotebookStateProvider.addNotebookPanel({ notebookPanel });
                        //  Handlers must be attached immediately in order to detect early events, hence we do not want to await the appearance of the Notebook.
                        let etcJupyterLabTelemetryLibrary = etcJupyterLabTelemetryLibraryFactory.create({ notebookPanel });
                        etcJupyterLabTelemetryLibrary.notebookClipboardEvent.notebookClipboardCopied.connect(telemetryHandler);
                        etcJupyterLabTelemetryLibrary.notebookClipboardEvent.notebookClipboardCut.connect(telemetryHandler);
                        etcJupyterLabTelemetryLibrary.notebookClipboardEvent.notebookClipboardPasted.connect(telemetryHandler);
                        etcJupyterLabTelemetryLibrary.notebookVisibilityEvent.notebookVisible.connect(telemetryHandler);
                        etcJupyterLabTelemetryLibrary.notebookVisibilityEvent.notebookHidden.connect(telemetryHandler);
                        etcJupyterLabTelemetryLibrary.notebookOpenEvent.notebookOpened.connect(telemetryHandler);
                        etcJupyterLabTelemetryLibrary.notebookCloseEvent.notebookClosed.connect(telemetryHandler);
                        etcJupyterLabTelemetryLibrary.notebookSaveEvent.notebookSaved.connect(telemetryHandler);
                        etcJupyterLabTelemetryLibrary.notebookScrollEvent.notebookScrolled.connect(telemetryHandler);
                        etcJupyterLabTelemetryLibrary.activeCellChangeEvent.activeCellChanged.connect(telemetryHandler);
                        etcJupyterLabTelemetryLibrary.cellAddEvent.cellAdded.connect(telemetryHandler);
                        etcJupyterLabTelemetryLibrary.cellRemoveEvent.cellRemoved.connect(telemetryHandler);
                        etcJupyterLabTelemetryLibrary.cellExecutionEvent.cellExecuted.connect(telemetryHandler);
                        etcJupyterLabTelemetryLibrary.cellErrorEvent.cellErrored.connect(telemetryHandler);
                    }));
            } catch (e) {
                console.error(e);
            }
        })();
    }
};
export default plugin;
