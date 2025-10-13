"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ObserverService = void 0;
class ObserverService {
    events = [];
    record(event) {
        this.events.push(event);
    }
    getRecordedEvents() {
        return [...this.events];
    }
}
exports.ObserverService = ObserverService;
