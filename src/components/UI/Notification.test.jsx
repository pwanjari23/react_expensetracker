import { render, screen } from '@testing-library/react';
import { describe, test, expect } from 'vitest';
import React from 'react';
import Notification from './Notification';

describe('Notification Component', () => {
  test('renders pending state notification with correct styling and message', () => {
    render(<Notification status="pending" title="Sending..." message="Data is being sent!" />);
    const titleEl = screen.getByText('Sending...');
    const msgEl = screen.getByText('Data is being sent!');
    
    expect(titleEl).toBeDefined();
    expect(msgEl).toBeDefined();
  });

  test('renders success state notification with correct styling and message', () => {
    render(<Notification status="success" title="Success!" message="Data sent successfully!" />);
    const titleEl = screen.getByText('Success!');
    const msgEl = screen.getByText('Data sent successfully!');
    
    expect(titleEl).toBeDefined();
    expect(msgEl).toBeDefined();
  });

  test('renders error state notification with correct styling and message', () => {
    render(<Notification status="error" title="Error!" message="Failed to send data!" />);
    const titleEl = screen.getByText('Error!');
    const msgEl = screen.getByText('Failed to send data!');
    
    expect(titleEl).toBeDefined();
    expect(msgEl).toBeDefined();
  });
});
