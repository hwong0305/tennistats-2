import React, { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import type { RegisterData } from '../types';
import styles from './Auth.module.css';

const Register: React.FC = () => {
  const [formData, setFormData] = useState<RegisterData>({
    email: '',
    password: '',
    firstName: '',
    lastName: ''
  });
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.register(formData);
      login(response.token, response.user);
      navigate('/dashboard');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to register';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Register for Tennis Tracker</h2>
      {error && <div className={styles.error}>{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label>First Name:</label>
          <input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            className={styles.input}
          />
        </div>
        <div className={styles.formGroup}>
          <label>Last Name:</label>
          <input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            className={styles.input}
          />
        </div>
        <div className={styles.formGroup}>
          <label>Email:</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className={styles.input}
          />
        </div>
        <div className={styles.formGroup}>
          <label>Password:</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            className={styles.input}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className={styles.submitButton}
        >
          {loading ? 'Registering...' : 'Register'}
        </button>
      </form>
      <p className={styles.footer}>
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </div>
  );
};

export default Register;
