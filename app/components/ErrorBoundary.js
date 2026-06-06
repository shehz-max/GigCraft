'use client';

import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          minHeight: '100vh', padding: '40px',
          fontFamily: 'Inter, sans-serif', textAlign: 'center',
          background: '#F5F3EE', color: '#1A1D20'
        }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '16px',
            background: '#FCE8E8', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            fontSize: '1.5rem', marginBottom: '20px'
          }}>
            ⚠️
          </div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '8px', fontFamily: 'Outfit, sans-serif' }}>
            Something went wrong
          </h2>
          <p style={{ fontSize: '0.88rem', color: '#858991', maxWidth: '400px', lineHeight: '1.6', marginBottom: '20px' }}>
            {this.state.error?.message || 'An unexpected error occurred. Please try refreshing the page.'}
          </p>
          <button
            onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}
            style={{
              padding: '10px 24px', background: '#35602C', color: 'white',
              border: 'none', borderRadius: '6px', cursor: 'pointer',
              fontFamily: 'Inter, sans-serif', fontSize: '0.85rem', fontWeight: 600
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
