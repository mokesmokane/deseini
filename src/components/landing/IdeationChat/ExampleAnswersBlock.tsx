import React from 'react';
import { useMessaging } from '../../../contexts/Messaging/MessagingProvider';

interface ExampleAnswersBlockProps {
  content: string;
}

const ExampleAnswersBlock: React.FC<ExampleAnswersBlockProps> = ({ content }) => {
  const { addMessage } = useMessaging();

  // Parse the example answers - split by blank lines
  const parseExampleAnswers = (content: string): string[] => {
    // Split by newlines first
    const lines = content.trim().split('\n');
    const answers: string[] = [];
    let currentAnswer = '';

    // Process line by line
    for (const line of lines) {
      if (line.trim() === '') {
        // Empty line indicates end of an answer
        if (currentAnswer.trim() !== '') {
          answers.push(currentAnswer.trim());
          currentAnswer = '';
        }
      } else {
        // Add to current answer
        currentAnswer += (currentAnswer ? '\n' : '') + line;
      }
    }

    // Add the last answer if there is one
    if (currentAnswer.trim() !== '') {
      answers.push(currentAnswer.trim());
    }

    return answers;
  };

  const handleSendAnswer = (answer: string) => {
    addMessage(answer);
  };

  const answers = parseExampleAnswers(content);

  return (
    <div className="example-answers-block my-4">
      <div className="flex flex-col gap-2">
        {answers.map((answer, index) => (
          <button
            key={`example-answer-${index}`}
            onClick={() => handleSendAnswer(answer)}
            className="bg-white text-black border border-white/20 py-2 px-4 rounded-md text-left hover:bg-white/90 transition-colors duration-200 shadow-sm"
          >
            {answer}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ExampleAnswersBlock;
