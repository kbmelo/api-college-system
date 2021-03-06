import { Schema, model, Document } from 'mongoose';
import { hash } from 'bcryptjs';

import SemesterSubschema, { ISemesterSubschema } from './utils/SemesterSubschema';

export interface IUserSchema extends Document {
  name: string;
  email: string;
  password?: string;
  active: boolean;
  role: string;
  cpf: string;
  firstSemester: ISemesterSubschema;
  registration: string;
  course: string;
}

const UserSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
    select: false,
  },
  active: {
    type: Boolean,
    default: false,
  },
  role: {
    type: String,
    enum: ['admin', 'student'],
    default: 'student',
  },
  cpf: {
    type: String,
    required: true,
    unique: true,
  },
  registration: {
    type: String,
    required: true,
    unique: true,
  },
  firstSemester: SemesterSubschema,
  course: {
    type: String,
    required: true,
  },
}, {
  timestamps: true,
});

UserSchema.pre<IUserSchema>('save', async function createHash(next) {
  if (this.email) {
    this.email = this.email.toLowerCase();
  }

  if (this.password) {
    this.password = await hash(this.password, 10);
  }

  return next();
});

export default model<IUserSchema>('User', UserSchema);
