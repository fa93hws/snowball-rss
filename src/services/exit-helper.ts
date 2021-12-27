export interface IExitHelper {
  onExpectedExit(e: any): Promise<never>;
  onUnexpectedExit(e: any): Promise<never>;
}
