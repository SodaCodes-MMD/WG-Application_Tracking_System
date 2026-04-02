// Set JWT_SECRET before any module is loaded
process.env.JWT_SECRET = 'test-jwt-secret-ownership';

const request = require('supertest');
const app = require('../app').default;
const jwt = require('jsonwebtoken');
const tokenService = require('../services/token-service');

// Auto-mock the entire job repository — all exports become jest.fn()
jest.mock('../repositories/job-repository');
const jobRepo = require('../repositories/job-repository');

describe('Job Ownership Enforcement (SCRUM-20)', () => {
  const userAId = 'aaaa00000000000000000001';
  const userBId = 'bbbb00000000000000000002';
  const jobId   = 'cccc00000000000000000003';

  let tokenA, tokenB;

  beforeEach(() => {
    jest.clearAllMocks();
    tokenService.clearBlacklist();
    tokenA = jwt.sign(
      { userId: userAId, email: 'usera@example.com' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    tokenB = jwt.sign(
      { userId: userBId, email: 'userb@example.com' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  it('should return 403 when user B tries to GET a job owned by user A', async () => {
    jobRepo.findJobById.mockResolvedValue({
      _id: jobId,
      userId: userAId,
      company: 'Acme Corp',
      title: 'Software Engineer',
      status: 'Applied',
    });

    const res = await request(app)
      .get(`/api/jobs/${jobId}`)
      .set('Authorization', `Bearer ${tokenB}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('should return 200 when user A accesses their own job', async () => {
    jobRepo.findJobById.mockResolvedValue({
      _id: jobId,
      userId: userAId,
      company: 'Acme Corp',
      title: 'Software Engineer',
      status: 'Applied',
    });

    const res = await request(app)
      .get(`/api/jobs/${jobId}`)
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.company).toBe('Acme Corp');
  });

  it('should return 404 when the job does not exist at all', async () => {
    jobRepo.findJobById.mockResolvedValue(null);

    const res = await request(app)
      .get(`/api/jobs/${jobId}`)
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('should return 401 when no token is provided', async () => {
    const res = await request(app).get(`/api/jobs/${jobId}`);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
