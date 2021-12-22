import { ILogger } from '@services/logging-service';

export class GlobalMutable {
  private _lastUpdateTime: Date | undefined;

  constructor(private readonly logger: ILogger) {
    this._lastUpdateTime = undefined;
  }

  get lastUpdateTime(): Date | undefined {
    return this._lastUpdateTime;
  }

  setLastUpdateTime(value: Date) {
    this._lastUpdateTime = value;
    this.logger.info(`last update time set to ${value.toISOString()}`);
  }
}
