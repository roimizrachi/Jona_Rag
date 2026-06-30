import { answerQuestion } from './answerService';
import { loadFirstPdf } from './dataLoader';

export const loadAllData = loadFirstPdf;
export const ask = answerQuestion;
