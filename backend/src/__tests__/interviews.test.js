// Set JWT_SECRET before any module is loaded
process.env.JWT_SECRET = 'test-jwt-secret-interviews';

const request = require('supertest');
const app = require('../app').default;
const jwt = require('jsonwebtoken');
const tokenService = require('../services/token-service');

jest.mock('../repositories/job-repository');
const jobRepo = require('../repositories/job-repository');

describe('Interview Tracking (SCRUM-43)', () => {
  const userId      = 'aaaa00000000000000000001';
  const otherUserId = 'bbbb00000000000000000002';
  const jobId       = 'cccc00000000000000000003';
  const interviewId = 'dddd00000000000000000004';

  let token, otherToken;

  beforeEach(() => {
    jest.clearAllMocks();
    tokenService.clearBlacklist();
    token      = jwt.sign({ userId,      email: 'user@example.com'  }, process.env.JWT_SECRET, { expiresIn: '1h' });
    otherToken = jwt.sign({ userId: otherUserId, email: 'other@example.com' }, process.env.JWT_SECRET, { expiresIn: '1h' });
  });

  const mockJobWithInterview = {
    _id: jobId,
    userId,
    company: 'Acme Corp',
    title: 'Engineer',
    status: 'Interview',
    interviews: [{ _id: interviewId, roundType: 'Technical', date: null, interviewer: '', notes: '' }],
  };

  // ── POST /api/jobs/:id/interviews ──────────────────────────────────────────

  it('adds interview to own job → 201', async () => {
    jobRepo.addInterview.mockResolvedValue(mockJobWithInterview);

    const res = await request(app)
      .post(`/api/jobs/${jobId}/interviews`)
      .set('Authorization', `Bearer ${token}`)
      .send({ roundType: 'Technical' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(jobRepo.addInterview).toHaveBeenCalledWith(
      jobId,
      userId,
      expect.objectContaining({ roundType: 'Technical' })
    );
  });

  it('returns 404 when job not found or belongs to another user → 404', async () => {
    jobRepo.addInterview.mockResolvedValue(null);

    const res = await request(app)
      .post(`/api/jobs/${jobId}/interviews`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ roundType: 'Behavioral' });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 when roundType is missing', async () => {
    const res = await request(app)
      .post(`/api/jobs/${jobId}/interviews`)
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(jobRepo.addInterview).not.toHaveBeenCalled();
  });

  it('returns 401 with no token', async () => {
    const res = await request(app)
      .post(`/api/jobs/${jobId}/interviews`)
      .send({ roundType: 'Technical' });

    expect(res.status).toBe(401);
  });

  // ── DELETE /api/jobs/:id/interviews/:interviewId ───────────────────────────

  it('removes interview from own job → 200', async () => {
    jobRepo.removeInterview.mockResolvedValue({ ...mockJobWithInterview, interviews: [] });

    const res = await request(app)
      .delete(`/api/jobs/${jobId}/interviews/${interviewId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(jobRepo.removeInterview).toHaveBeenCalledWith(jobId, userId, interviewId);
  });

  it('returns 404 when deleting interview from another user\'s job', async () => {
    jobRepo.removeInterview.mockResolvedValue(null);

    const res = await request(app)
      .delete(`/api/jobs/${jobId}/interviews/${interviewId}`)
      .set('Authorization', `Bearer ${otherToken}`);

    expect(res.status).toBe(404);
  });

  // ── PATCH /api/jobs/:id/interviews/:interviewId ────────────────────────────

  it('updates interview on own job → 200', async () => {
    const updated = { ...mockJobWithInterview, interviews: [{ _id: interviewId, roundType: 'Behavioral', date: null, interviewer: 'Jane', notes: '' }] };
    jobRepo.updateInterview.mockResolvedValue(updated);

    const res = await request(app)
      .patch(`/api/jobs/${jobId}/interviews/${interviewId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ roundType: 'Behavioral', interviewer: 'Jane' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(jobRepo.updateInterview).toHaveBeenCalledWith(
      jobId,
      userId,
      interviewId,
      expect.objectContaining({ roundType: 'Behavioral', interviewer: 'Jane' })
    );
  });
});
