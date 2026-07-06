import { contextBridge } from 'electron'
import { electronAPI } from './api'

contextBridge.exposeInMainWorld('electronAPI', electronAPI)
