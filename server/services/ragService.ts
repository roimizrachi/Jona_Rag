import { answerQuestion } from './answerService';
import { loadAllDataSources } from './dataLoader';

export const loadAllData = loadAllDataSources;
export const ask = answerQuestion;
