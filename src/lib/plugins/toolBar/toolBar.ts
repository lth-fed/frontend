import { registerPlugin } from '@capacitor/core';
import type { ToolBarPlugin } from './definitions';

export const toolBar = registerPlugin<ToolBarPlugin>('ToolBar');
