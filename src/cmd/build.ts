import { DefineCommand } from '@artus-cli/artus-cli';

import { MainCommand } from './main';
import { Builder } from '../lib/builder';

@DefineCommand({ command: 'build <inputs..>' })
export class BuildCommand extends MainCommand {
  async run() {
    this.mergeConfig();
    this.builder = new Builder(this.config);
    this.builder.start(this.inputs);
  }
}
