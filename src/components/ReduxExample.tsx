import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { loginUser, logoutUser } from '../store/thunks/authThunks';
import { updateProfile, updatePreferences } from '../store/slices/userSlice';
import { togglePremium } from '../store/slices/authSlice';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Crown } from 'lucide-react';

const ReduxExample: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user, isAuthenticated, isLoading, error } = useAppSelector((state) => state.auth);
  const { profile, preferences } = useAppSelector((state) => state.user);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await dispatch(loginUser({ email, password })).unwrap();
      setEmail('');
      setPassword('');
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleLogout = () => {
    dispatch(logoutUser());
  };

  const handleUpdateProfile = () => {
    if (user) {
      dispatch(updateProfile({
        name: 'Updated Name',
        bio: 'This is an updated bio',
      }));
    }
  };

  const handleToggleTheme = () => {
    const newTheme = preferences.theme === 'light' ? 'dark' : 'light';
    dispatch(updatePreferences({ theme: newTheme }));
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Redux State Management Example</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Authentication Status */}
          <div className="flex items-center gap-2">
            <span className="font-medium">Status:</span>
            <Badge variant={isAuthenticated ? 'default' : 'secondary'}>
              {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
            </Badge>
          </div>

          {/* Login Form */}
          {!isAuthenticated && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Logging in...' : 'Login'}
              </Button>
              {error && <p className="text-red-500 text-sm">{error}</p>}
            </form>
          )}

          {/* User Info */}
          {isAuthenticated && user && (
            <div className="space-y-4">
              <div>
                <h3 className="font-medium">User Information:</h3>
                <div className="flex items-center gap-2">
                  <span>Name: {user.name}</span>
                  {user.isPremium && (
                    <div className="flex items-center gap-1">
                      <Crown className="w-4 h-4 text-yellow-500" />
                      <span className="px-2 py-1 text-xs font-medium bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-full">
                        PRO
                      </span>
                    </div>
                  )}
                </div>
                <p>Email: {user.email}</p>
                <p>Role: {user.role}</p>
                <p>Premium: {user.isPremium ? 'Yes' : 'No'}</p>
              </div>
              
              <div className="flex gap-2 flex-wrap">
                <Button onClick={handleUpdateProfile}>
                  Update Profile
                </Button>
                <Button 
                  onClick={() => dispatch(togglePremium())} 
                  variant="outline"
                  className="border-yellow-500 text-yellow-600 hover:bg-yellow-50"
                >
                  {user.isPremium ? 'Remove Premium' : 'Add Premium'}
                </Button>
                <Button onClick={handleLogout} variant="outline">
                  Logout
                </Button>
              </div>
            </div>
          )}

          {/* User Preferences */}
          <div>
            <h3 className="font-medium mb-2">User Preferences:</h3>
            <div className="flex items-center gap-2">
              <span>Theme: {preferences.theme}</span>
              <Button onClick={handleToggleTheme} size="sm">
                Toggle Theme
              </Button>
            </div>
            <p>Notifications: {preferences.notifications ? 'On' : 'Off'}</p>
            <p>Email Updates: {preferences.emailUpdates ? 'On' : 'Off'}</p>
          </div>

          {/* Profile Info */}
          {profile && (
            <div>
              <h3 className="font-medium mb-2">Profile Information:</h3>
              <p>Bio: {profile.bio || 'No bio set'}</p>
              <p>Location: {profile.location || 'No location set'}</p>
              <p>Website: {profile.website || 'No website set'}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ReduxExample; 