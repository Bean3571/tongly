import { BaseEntity } from './common';

/**
 * Interest and Goal related types
 */

// Interest model
export interface Interest extends BaseEntity {
  id: number;
  name: string;
}

// User interest
export interface UserInterest extends BaseEntity {
  userId: number;
  interestId: number;
  interest?: Interest;
}

// Goal model
export interface Goal extends BaseEntity {
  id: number;
  name: string;
}

// User goal
export interface UserGoal extends BaseEntity {
  userId: number;
  goalId: number;
  goal?: Goal;
} 