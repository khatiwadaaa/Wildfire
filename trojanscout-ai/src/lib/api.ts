import axios from 'axios';
import { mockPlayers } from '../data/mockPlayers';
import type { Player, VideoAnalysis, ComparisonResult } from '../types';
const USE_MOCK = import.meta.env.VITE_USE_MOCK_API !== 'false';
export const api = axios.create({baseURL:import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',timeout:30000});
export const playerApi={
 async list():Promise<Player[]>{if(USE_MOCK)return mockPlayers;return (await api.get<Player[]>('/players')).data;},
 async get(id:string):Promise<Player>{if(USE_MOCK){const p=mockPlayers.find(x=>x.id===id);if(!p)throw new Error('Player not found');return p;}return (await api.get<Player>(`/players/${id}`)).data;},
 async create(payload:Partial<Player>):Promise<Player>{if(USE_MOCK){const p={...mockPlayers[0],...payload,id:`local-${Date.now()}`} as Player;mockPlayers.unshift(p);return p;}return (await api.post<Player>('/players',payload)).data;},
};
export const videoApi={async analyze(file:File,selection:{x:number;y:number;timestamp:number}):Promise<VideoAnalysis>{if(USE_MOCK)return {id:'demo-analysis',filename:file.name,status:'Completed',progress:100,frames:[],metrics:{distance:2.8,topSpeed:16.4,possessions:18,minutesTracked:4.2}};const form=new FormData();form.append('file',file);form.append('selection',JSON.stringify(selection));return (await api.post<VideoAnalysis>('/videos/analyze',form)).data;},async results(id:string):Promise<VideoAnalysis>{return (await api.get<VideoAnalysis>(`/videos/${id}/results`)).data;}};
export const comparisonApi={async create(referenceId:string,candidateIds:string[],weights:Record<string,number>):Promise<ComparisonResult>{if(USE_MOCK){const similarityByPlayer:Record<string,number>={};candidateIds.forEach((id,i)=>similarityByPlayer[id]=[91,84,78,73,69][i]??65);return {id:'demo-comparison',referenceId,candidateIds,similarityByPlayer,explanations:Object.fromEntries(candidateIds.map(id=>[id,{strengths:['Creation and playmaking','Perimeter efficiency'],gaps:['Defensive size'],missing:['Opponent-adjusted efficiency']}]))};}return (await api.post<ComparisonResult>('/comparisons',{reference_id:referenceId,candidate_ids:candidateIds,weights})).data;}};
