import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

interface LessonRatingProps {
  lessonId: number;
  tutorName: string;
  onSubmit: () => void;
}

const LessonRating: React.FC<LessonRatingProps> = ({ lessonId, tutorName, onSubmit }) => {
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/lessons/${lessonId}/rate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rating, comment }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit rating');
      }

      onSubmit();
      navigate('/dashboard');
    } catch (error) {
      setError('Failed to submit rating. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setComment(e.target.value);
  };

  return (
    <Container>
      <Card>
        <Title>Rate Your Lesson</Title>
        <Subtitle>with {tutorName}</Subtitle>

        <Form onSubmit={handleSubmit}>
          <RatingContainer>
            {[1, 2, 3, 4, 5].map((value) => (
              <StarButton
                key={value}
                type="button"
                selected={value <= rating}
                onClick={() => setRating(value)}
                disabled={isSubmitting}
              >
                ⭐
              </StarButton>
            ))}
          </RatingContainer>

          <RatingLabel>
            {rating === 0 ? 'Select a rating' :
             rating === 1 ? 'Poor' :
             rating === 2 ? 'Fair' :
             rating === 3 ? 'Good' :
             rating === 4 ? 'Very Good' : 'Excellent'}
          </RatingLabel>

          <TextArea
            placeholder="Share your experience (optional)"
            value={comment}
            onChange={handleCommentChange}
            disabled={isSubmitting}
            maxLength={500}
          />

          {error && <ErrorMessage>{error}</ErrorMessage>}

          <ButtonGroup>
            <SkipButton
              type="button"
              onClick={() => navigate('/dashboard')}
              disabled={isSubmitting}
            >
              Skip
            </SkipButton>
            <SubmitButton
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Rating'}
            </SubmitButton>
          </ButtonGroup>
        </Form>
      </Card>
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: #f8f9fa;
  padding: 2rem;
`;

const Card = styled.div`
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 500px;
`;

const Title = styled.h1`
  margin: 0;
  font-size: 1.8rem;
  color: #2c3e50;
  text-align: center;
`;

const Subtitle = styled.div`
  color: #666;
  text-align: center;
  margin-top: 0.5rem;
  margin-bottom: 2rem;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const RatingContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 0.5rem;
`;

interface StarButtonProps {
  selected: boolean;
}

const StarButton = styled.button<StarButtonProps>`
  background: none;
  border: none;
  font-size: 2rem;
  cursor: pointer;
  padding: 0;
  opacity: ${(props: StarButtonProps) => props.selected ? 1 : 0.3};
  transition: opacity 0.2s, transform 0.2s;

  &:hover {
    transform: scale(1.1);
  }

  &:disabled {
    cursor: not-allowed;
  }
`;

const RatingLabel = styled.div`
  text-align: center;
  font-size: 1.1rem;
  color: #666;
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: 120px;
  padding: 1rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  resize: vertical;
  font-family: inherit;
  font-size: 1rem;

  &:focus {
    outline: none;
    border-color: #4a90e2;
  }

  &:disabled {
    background: #f8f9fa;
    cursor: not-allowed;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
`;

const Button = styled.button`
  flex: 1;
  padding: 0.8rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.7;
  }
`;

const SubmitButton = styled(Button)`
  background: #4a90e2;
  color: white;
  border: none;

  &:hover:not(:disabled) {
    background: #357abd;
  }
`;

const SkipButton = styled(Button)`
  background: white;
  color: #666;
  border: 1px solid #ddd;

  &:hover:not(:disabled) {
    background: #f8f9fa;
  }
`;

const ErrorMessage = styled.div`
  color: #e74c3c;
  text-align: center;
  font-size: 0.9rem;
`;

export default LessonRating; 