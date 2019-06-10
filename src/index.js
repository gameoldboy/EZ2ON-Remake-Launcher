const {
  app,
  BrowserWindow,
  Menu
} = require('electron');
const fs = require('fs');
const path = require('path');
const request = require('request');
const progress = require('request-progress');
const sevenBin = require('7zip-bin');
const seven = require('node-7z');

const isDev = require('electron-is-dev');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}

function downloadsSrc() {
  if (isDev) {
    createWindow();
  } else {
    if (!fs.existsSync('download'))
      fs.mkdirSync('download');
    if (!fs.existsSync('client'))
      fs.mkdirSync('client');
    if (!fs.existsSync(path.join('client', 'EZRData')))
      fs.mkdirSync(path.join('client', 'EZRData'));
    progress(request('https://ez2on.gameoldboy.com/ez2on-remake/launcher/src.7z'), {})
      .on('error', err => {
        createWindow();
      })
      .on('end', () => {
        const myStream = seven.extractFull(path.join('download', 'src.7z'), __dirname, {
          $bin: sevenBin.path7za,
          overwrite: 'a'
        });
        myStream.on('error', err => {
          createWindow();
        });
        myStream.on('end', () => {
          createWindow();
        });
      })
      .pipe(fs.createWriteStream(path.join('download', 'src.7z')));
  }
}

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true
    },
    center: true,
    resizable: false,
    show: false
  });

  Menu.setApplicationMenu(null);

  // and load the index.html of the app.
  mainWindow.loadFile(`${__dirname}/index.html`);

  // Open the DevTools.
  if (isDev)
    mainWindow.webContents.openDevTools({
      mode: 'undocked'
    });

  // Emitted when the window is closed.
  mainWindow.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });
};

const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // 当运行第二个实例时,将会聚焦到myWindow这个窗口
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  app.on('ready', downloadsSrc);

  // Quit when all windows are closed.
  app.on('window-all-closed', () => {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
      downloadsSrc();
    }
  });
}
// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.