import supertest from 'supertest';
import faker from 'faker';
import { generate as generateCPF } from 'cpf';

import app from '../../src/config/app';

import Discipline from '../../src/models/Discipline';
import User from '../../src/models/User';

import generateRandomNumber from '../../src/utils/generateRandomNumber';
import generateRegistration from '../../src/utils/generateRegistration';

const request = supertest(app);

const generateDiscipline = () => ({
  name: faker.name.findName(),
  professor: faker.name.findName(),
  difficulty: generateRandomNumber(1, 5),
  schedule: [
    {
      startHourInMinutes: generateRandomNumber(0, 700),
      endHourInMinutes: generateRandomNumber(701, 24 * 60 - 1),
      day: generateRandomNumber(0, 6),
    },
    {
      startHourInMinutes: generateRandomNumber(0, 700),
      endHourInMinutes: generateRandomNumber(701, 24 * 60 - 1),
      day: generateRandomNumber(0, 6),
    },
  ],
});

const generateUser = (isSuperUser: Boolean = false) => ({
  name: faker.name.findName(),
  email: faker.internet.email(),
  password: '123123',
  cpf: generateCPF(false),
  year: 2019,
  unity: 1,
  course: 'Sistemas de informação',
  role: isSuperUser ? 'admin' : 'student',
});

const loginAsSuperUser = async (email: string, password: string) => {
  const { body } = await request
    .post('/login')
    .send({ login: email, password });

  return body.data.token;
};

describe('Test disciplines\' controllers', () => {
  type SuperUserType = {
    _id: string;
    email: string;
    token: string;
  }
  const superUserInfo = {} as SuperUserType;

  beforeAll(async () => {
    const newSuperUserInfo = {
      ...generateUser(true),
      registration: generateRegistration(),
    };

    const superUser = await User.create(newSuperUserInfo);

    const { _id, email } = superUser;

    const token = await loginAsSuperUser(email, newSuperUserInfo.password);

    superUserInfo.email = email;
    superUserInfo._id = _id;
    superUserInfo.token = token;
  });

  afterAll(async () => User.findByIdAndDelete(superUserInfo._id));

  test('Should list disciplines', async () => {
    const { body, status } = await request
      .get('/disciplines')
      .set('authorization', `Bearer ${superUserInfo.token}`);

    const { data } = body;

    const [firstDiscipline] = data;

    expect(Array.isArray(data)).toBe(true);
    expect(status).toBe(200);
    expect(typeof firstDiscipline.name).toBe('string');
    expect(typeof firstDiscipline.professor).toBe('string');
    expect(typeof firstDiscipline.difficulty).toBe('number');
    expect(typeof firstDiscipline.schedule).toBe('object');
  });

  test('Should NOT create a discipline', async () => {
    const newDisciplineInfo = generateDiscipline();
    newDisciplineInfo.schedule[0].startHourInMinutes = (
      newDisciplineInfo.schedule[0].endHourInMinutes + 1
    );

    const { body, status } = await request
      .post('/disciplines')
      .send(newDisciplineInfo)
      .set('authorization', `Bearer ${superUserInfo.token}`);

    const { data } = body;

    expect(typeof data).toBe('string');
    expect(status).toBe(400);
  });

  test('Should create a discipline', async () => {
    const newDisciplineInfo = generateDiscipline();

    const { body, status } = await request
      .post('/disciplines')
      .send(newDisciplineInfo)
      .set('authorization', `Bearer ${superUserInfo.token}`);

    const { data } = body;

    await Discipline.findByIdAndDelete(data._id);

    expect(status).toBe(201);
    expect(typeof data).toBe('object');
    expect(data.name).toBe(newDisciplineInfo.name);
    expect(data.professor).toBe(newDisciplineInfo.professor);
    expect(data.difficulty).toBe(newDisciplineInfo.difficulty);
    expect(Array.isArray(data.schedule)).toBe(true);

    const [dataSpecificTimeRange] = data.schedule;
    const [datnewInfoSpecificTimeRange] = newDisciplineInfo.schedule;

    expect(dataSpecificTimeRange.startHourInMinutes).toBe(
      datnewInfoSpecificTimeRange.startHourInMinutes,
    );
    expect(dataSpecificTimeRange.endHourInMinutes).toBe(
      datnewInfoSpecificTimeRange.endHourInMinutes,
    );
    expect(dataSpecificTimeRange.day).toBe(
      datnewInfoSpecificTimeRange.day,
    );
  });
  test('Should detail a discipline', async () => {
    const newDisciplineInfo = generateDiscipline();

    const newDiscipline = await Discipline.create(newDisciplineInfo);

    const { body, status } = await request
      .get(`/disciplines/${newDiscipline._id}`)
      .set('authorization', `Bearer ${superUserInfo.token}`);

    const { data } = body;

    await Discipline.findByIdAndDelete(data._id);

    expect(status).toBe(200);
    expect(typeof data).toBe('object');
    expect(data.name).toBe(newDisciplineInfo.name);
    expect(data.professor).toBe(newDisciplineInfo.professor);
    expect(data.difficulty).toBe(newDisciplineInfo.difficulty);
    expect(Array.isArray(data.schedule)).toBe(true);

    const [dataSpecificTimeRange] = data.schedule;
    const [datnewInfoSpecificTimeRange] = newDisciplineInfo.schedule;

    expect(dataSpecificTimeRange.startHourInMinutes).toBe(
      datnewInfoSpecificTimeRange.startHourInMinutes,
    );
    expect(dataSpecificTimeRange.endHourInMinutes).toBe(
      datnewInfoSpecificTimeRange.endHourInMinutes,
    );
    expect(dataSpecificTimeRange.day).toBe(
      datnewInfoSpecificTimeRange.day,
    );
  });
  test('Should NOT detail a discipline (wrong id)', async () => {
    const { body, status } = await request
      .get('/disciplines/600566dca73e1f2b2cd112f3')
      .set('authorization', `Bearer ${superUserInfo.token}`);

    const { data } = body;

    expect(status).toBe(404);
    expect(typeof body).toBe('object');
    expect(Array.isArray(body)).toBe(false);
    expect(data).toBe('Discipline not found');
  });
  test('It should update an discipline', async () => {
    const newDisciplineInfo = generateDiscipline();

    const newDiscipline = await Discipline.create(newDisciplineInfo);

    const newInfo = generateDiscipline();

    const { body, status } = await request
      .patch(`/disciplines/${newDiscipline._id}`)
      .send(newInfo)
      .set('authorization', `Bearer ${superUserInfo.token}`);

    await Discipline.findByIdAndDelete(newDiscipline._id);

    const { data } = body;

    expect(status).toBe(200);
    expect(typeof body).toBe('object');
    expect(Array.isArray(body)).toBe(false);
    expect(data.name).toBe(newInfo.name);
    expect(data.professor).toBe(newInfo.professor);
    expect(data.difficulty).toBe(newInfo.difficulty);
    expect(Array.isArray(data.schedule)).toBe(true);

    const [dataSpecificTimeRange] = data.schedule;
    const [datnewInfoSpecificTimeRange] = newInfo.schedule;

    expect(dataSpecificTimeRange.startHourInMinutes).toBe(
      datnewInfoSpecificTimeRange.startHourInMinutes,
    );
    expect(dataSpecificTimeRange.endHourInMinutes).toBe(
      datnewInfoSpecificTimeRange.endHourInMinutes,
    );
    expect(dataSpecificTimeRange.day).toBe(
      datnewInfoSpecificTimeRange.day,
    );
  });
  test('It should NOT update an discipline (wrong id)', async () => {
    const { body, status } = await request
      .patch('/disciplines/600566dca73e1f2b2cd112f3')
      .set('authorization', `Bearer ${superUserInfo.token}`);

    const { data } = body;

    expect(status).toBe(404);
    expect(typeof body).toBe('object');
    expect(Array.isArray(body)).toBe(false);
    expect(data).toBe('Discipline not found');
  });

  test('It should NOT update an discipline (invalid time range)', async () => {
    const newDisciplineInfo = generateDiscipline();

    const newDiscipline = await Discipline.create(newDisciplineInfo);

    const newInfo = generateDiscipline();
    newInfo.schedule[0] = {
      ...newInfo.schedule[0],
      startHourInMinutes: 2,
      endHourInMinutes: 1,
    };

    const { body, status } = await request
      .patch(`/disciplines/${newDiscipline._id}`)
      .send(newInfo)
      .set('authorization', `Bearer ${superUserInfo.token}`);

    await Discipline.findByIdAndDelete(newDiscipline._id);

    const { data } = body;

    expect(status).toBe(400);
    expect(typeof body).toBe('object');
    expect(Array.isArray(body)).toBe(false);
    expect(typeof data).toBe('string');
  });

  test('It should delete an discipline', async () => {
    const newDisciplineInfo = generateDiscipline();

    const newDiscipline = await Discipline.create(newDisciplineInfo);

    const { body, status } = await request
      .delete(`/disciplines/${newDiscipline._id}`)
      .set('authorization', `Bearer ${superUserInfo.token}`);

    const { data } = body;

    expect(status).toBe(200);
    expect(typeof body).toBe('object');
    expect(Array.isArray(body)).toBe(false);
    expect(data).toBe('Deleted successfully');
  });
  test('It should NOT delete an discipline (wrong id)', async () => {
    const { body, status } = await request
      .delete('/disciplines/600566dca73e1f2b2cd112f3')
      .set('authorization', `Bearer ${superUserInfo.token}`);

    const { data } = body;

    expect(status).toBe(404);
    expect(typeof body).toBe('object');
    expect(Array.isArray(body)).toBe(false);
    expect(data).toBe('Discipline not found');
  });
});
