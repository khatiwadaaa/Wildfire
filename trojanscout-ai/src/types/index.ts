export type Position = 'PG'|'SG'|'SF'|'PF'|'C';
export type PlayerCategory = 'Current Athlete'|'Graduating Athlete'|'Prospective Recruit';
export interface Player { id:string; name:string; school:string; position:Position; height:string; gradYear:number; category:PlayerCategory; ppg:number; apg:number; rpg:number; fgPct:number; threePct:number; spg:number; bpg:number; topg:number; games:number; minutes:number; strengths:string[]; weaknesses:string[]; notes:string; }
export interface TrackingFrame { timestamp:number; boxes:{x:number;y:number;width:number;height:number;label?:string;selected?:boolean}[]; }
export interface VideoAnalysis { id:string; filename:string; status:'Not Started'|'Processing'|'Completed'|'Tracking Lost'|'Failed'; progress:number; frames:TrackingFrame[]; metrics?:{distance:number;topSpeed:number;possessions:number;minutesTracked:number}; }
export interface ComparisonResult { id:string; referenceId:string; candidateIds:string[]; similarityByPlayer:Record<string,number>; explanations:Record<string,{strengths:string[];gaps:string[];missing:string[]}>; }
export interface RosterSimulation { graduatingIds:string[]; recruitIds:string[]; coverage:number; gaps:{position:Position;severity:'Low'|'Medium'|'High';detail:string}[]; }
export interface ScoutingReport { playerId:string; summary:string; strengths:string[]; weaknesses:string[]; roleFit:string; completeness:number; evidence:{label:string;timestamp:number}[]; }
