import { Service } from "typedi";

@Service()
export class BackupService3 {
  public async test(redis_id: string): Promise<any> {
    return true;
  }
}
