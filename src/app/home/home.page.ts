import { Component, NgZone, OnInit } from '@angular/core';
import { BLE } from '@ionic-native/ble/ngx';
import { LoadingController, AlertController, ToastController } from '@ionic/angular';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {

  devices = [];
  isScan: boolean = false;

  deviceConnected:any;

  isConnectDevice: boolean = false;

  statusMessage: string;

  load: HTMLIonLoadingElement = null;

  responseDevice: any = [];

  constructor(
    private ble: BLE,
    private ngZone: NgZone,
    public loading: LoadingController,
    public alert: AlertController,
    public toast: ToastController,
  ) {
    this.isScan = false;
    this.isConnectDevice = false;
  }

  ngOnInit(){
    this.isScan = false;
    this.isConnectDevice = false;
    this.responseDevice = [];
  }

  async listDevices() {
    await this.loading.create({
      message: 'Buscando Dispositivos Bluetooh...',
      spinner: "dots",
      cssClass: 'loading-Custom',
    }).then((load: HTMLIonLoadingElement) => {
      this.load = load;
    });
    this.ble.isEnabled().then(() => {
      this.load.present();
      this.isScan = true;
      this.devices = [];
      this.ble.scan([], 5).subscribe(
        (device) => this.onDeviceDiscovered(device),
        (error) => this.showError("No se encontraro dispositivos"+ error)
      );
      setTimeout(() => {
        this.setStatus.bind(this);
        this.isScan = false;
        this.loading.dismiss();
      }, 5000, "Escaneo completado");
    },(error) => {
      console.log("Error si el bluetooh esta habilitado",error);
      this.showError("No se encuentra encendido el Bluetooh");
    });
  }

  setStatus(message) {
    this.showToast(message);
    this.ngZone.run(() => {
      this.statusMessage = message;
    });
  }

  async showError(error) {
    const alert = await this.alert.create({
      header: "Ocurrio un problema",
      mode: 'ios',
      subHeader: error,
      buttons: ["OK"]
    });
    await alert.present();
  }

  async showToast(msj) {
    const toast = await this.toast.create({
      message: msj,
      duration: 1000
    });
    await toast.present();
  }

  onDeviceDiscovered(device) {
    console.log(device);
    this.ngZone.run(() => {
      this.devices.push(device);
    });
  }

  async connect(device){
    await this.loading.create({
      message: 'connectando con el dispositivo '+device.name+' ...',
      spinner: "dots",
      cssClass: 'loading-Custom',
    }).then((load: HTMLIonLoadingElement) => {
      this.load = load;
      this.load.present();
    });
    this.ble.connect(device.id).subscribe((connect) => {
      console.log("connectado",connect);
      this.isConnectDevice = true;
      this.deviceConnected = connect;
      this.responseDevice = [];
      this.startEventNotification();
      setTimeout(() => {
        this.load.dismiss()
        this.isConnectDevice = true;
        this.deviceConnected = connect;
        this.responseDevice = [];
      },1000);
    },(error) => {
      console.log("Error al conectar",error);
      this.isConnectDevice = false;
      this.showError("Error al conectar "+error);
    })

    if(!this.isConnectDevice || !this.deviceConnected){
      this.connect(device);
    }
  }

  async disconnet(){
    await this.loading.create({
      message: 'desconectando con el dispositivo '+this.deviceConnected.name+' ...',
      spinner: "dots",
      cssClass: 'loading-Custom',
    }).then((load: HTMLIonLoadingElement) => {
      this.load = load;
    });
    this.stopEventNotification();
    this.ble.disconnect(this.deviceConnected.id).then((res) => {
      console.log("Desconectando",res);
      this.isConnectDevice = false;
      this.deviceConnected = null;
      this.responseDevice = [];
      setTimeout(() => {
        this.load.dismiss();
        this.isConnectDevice = false;
        this.deviceConnected = null;
        this.responseDevice = [];
      },1000);
    },(error) => {
      console.log(error);
      this.showError("Error al desconectar: "+error);
    })
  }

  //Parar de escuchar el Ble
  stopEventNotification(){
    this.ble.stopNotification(this.deviceConnected.id,'ffe0','ffe1').then((response) => {
      console.log("stopEventNotification",response);
    })
  }

  //Escuchar al BLE
  startEventNotification(){
    this.ble.startNotification(this.deviceConnected.id,'ffe0','ffe1').subscribe((response) => {
      console.log("startNotification",response);
      this.responseDevice.push(this.bytesToString(response));
    },(error) => {
      console.log("Ocurrio un error",error);
      this.load.dismiss();
    })
  }

  // ASCII only
  stringToBytes(string) {
    var array = new Uint8Array(string.length);
    for (var i = 0, l = string.length; i < l; i++) {
      array[i] = string.charCodeAt(i);
    }
    return array.buffer;
  }
    
  bytesToString(buffer) {
    return String.fromCharCode.apply(null, new Uint8Array(buffer));
  }



}
