import { useState, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import { Text, Loader, Flex, TextInput, Paper, Title } from '@mantine/core';
import { IconSend } from '@tabler/icons-react';

const RAGInterface = observer(() => {
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleQuestionClick = (questionText: string) => {
    setQuestion(questionText);
    inputRef.current?.focus();
  };

  const submitQuestion = async () => {
    if (!question.trim()) return;

    setIsLoading(true);
    setError('');
    setResponse('');

    try {
      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userQuestion: question }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response');
      }

      setResponse(data.answer);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      submitQuestion();
    }
  };

  const renderGuidingQuestion = (question: string) => (
    <span
      className='guiding-question'
      onClick={() => handleQuestionClick(question)}
    >
      {question}
    </span>
  );

  return (
    <Flex
      w={'80vw'}
      h={'100vh'}
      p={'xl'}
      align={'center'}
      style={{ justifySelf: 'center' }}
      direction={'column'}
      gap={'xl'}
    >
      <Title order={2}>LevBoots Brain</Title>

      <Flex direction={'column'} gap={'xs'}>
        <TextInput
          ref={inputRef}
          w={'100%'}
          size={'lg'}
          radius={'xl'}
          variant='filled'
          placeholder='Ask anything about LevBoots'
          value={question}
          onChange={(event) => setQuestion(event.currentTarget.value)}
          onKeyDown={handleKeyDown}
          rightSection={
            <IconSend
              style={{ cursor: 'pointer' }}
              size={16}
              onClick={submitQuestion}
            />
          }
          autoFocus
        />
        <Text fz={'xs'} c={'dimmed'}>
          Suggestions: {renderGuidingQuestion('How do levboots work?')}
          {' • '}
          {renderGuidingQuestion('What are some safety features?')}
          {' • '}
          {renderGuidingQuestion(
            'How much is the custom bootskin market worth?'
          )}
        </Text>
      </Flex>

      {isLoading && (
        <Flex align='center' gap='md'>
          <Loader size='sm' />
          <Text>Getting your answer...</Text>
        </Flex>
      )}

      {error && (
        <Paper p='md' bg='red.1' c='red.8' w='100%'>
          <Text size='sm'>{error}</Text>
        </Paper>
      )}

      {response && !isLoading && (
        <Flex p='lg' direction={'column'} align={'start'} w={'100%'}>
          <Title order={4}>Answer</Title>
          <Paper w='100%'>
            <Text>{response}</Text>
          </Paper>
        </Flex>
      )}
    </Flex>
  );
});

export default RAGInterface;
