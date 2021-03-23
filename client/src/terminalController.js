import ComponentsBuilder from './components.js';
import { constants } from './constants.js';

export default class TerminalController {
  #usersColors = new Map();

  constructor() {}

  #pickColor() {
    return `#` + (((1 << 24) * Math.random()) | 0).toString(16) + `-fg`;
  }

  #onInputReceived(eventEmitter) {
    return function () {
      const message = this.getValue();

      console.log(message);

      this.clearValue();
    };
  }

  #getUserColor(userName) {
    if (this.#usersColors.has(userName)) return this.#usersColors.get(userName);

    const color = this.#pickColor();
    this.#usersColors.set(userName, color);

    return color;
  }

  #onMessageReceived({ screen, chat }) {
    return (msg) => {
      const { userName, message } = msg;
      const color = this.#getUserColor(userName);

      chat.addItem(`{${color}}{bold}${userName}{/}: ${message}`);
      screen.render();
    };
  }

  #onLogChanged({ screen, activityLog }) {
    return (msg) => {
      const [userName] = msg.split(/\s/);
      const color = this.#getUserColor(userName);
      activityLog.addItem(`{${color}}{bold}${msg.toString()}{/}`);

      screen.render();
    };
  }

  #onStatusChanged({ screen, status }) {
    return (users) => {
      const { content } = status.items.shift();

      status.clearItems();
      status.addItem(content);
      
      users.forEach((userName) => {
        const color = this.#getUserColor(userName);
        status.addItem(`{${color}}{bold}${userName}{/}`);
      });

      screen.render();
    };
  }

  #registerEvents(eventEmitter, components) {
    eventEmitter.on(constants.events.app.MESSAGE_RECEIVED, this.#onMessageReceived(components));
    eventEmitter.on(constants.events.app.ACTIVITYLOG_UPDATED, this.#onLogChanged(components));
    eventEmitter.on(constants.events.app.STATUS_UPDATED, this.#onStatusChanged(components));
  }

  async initializeTable(eventEmitter) {
    const components = new ComponentsBuilder()
      .setScreen({ title: 'HackerChat - Geraldo Júnior' })
      .setLayoutComponent()
      .setInputComponent(this.#onInputReceived(eventEmitter))
      .setChatComponent()
      .setActivityLog()
      .setStatusComponent()
      .build();

    this.#registerEvents(eventEmitter, components);

    components.input.focus();
    components.screen.render();

    // setInterval(() => {
    const users = ['gerjunior'];
    eventEmitter.emit(constants.events.app.STATUS_UPDATED, users);
    users.push('mariazinha');

    eventEmitter.emit(constants.events.app.STATUS_UPDATED, users);
    users.push('raptado');

    eventEmitter.emit(constants.events.app.STATUS_UPDATED, users);
    users.push('troll001', 'homedeferro112');

    eventEmitter.emit(constants.events.app.STATUS_UPDATED, users);
    // }, 2000);
  }
}
