import { Request, Response } from 'express';
import { ask, loadAllData } from '../services/ragService';

export const loadData = async (_: Request, res: Response): Promise<void> => {
  try {
    await loadAllData();
    res.status(200).json({ ok: true });
  } catch (error) {
    res.status(500).json({
      answer: '',
      error: 'Failed to load data',
    });
  }
};

export const askQuestion = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { userQuestion } = req.body || {};
    if (!userQuestion) {
      res.status(400).json({
        answer: '',
        error: 'You must provide the userQuestion',
      });
      return;
    }

    const answer = await ask(userQuestion);
    res.status(200).json({ answer });
  } catch (error) {
    res.status(500).json({
      answer: '',
      error: 'Failed to get answer for question',
    });
  }
};
