import React, { useState } from 'react';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '../../components/ui/alert';
import { ThemeToggle } from '../../components/ThemeToggle';
import { useNavigate } from 'react-router-dom';
import { useRoleNavigation } from '../../hooks/useRoleNavigation';

const initialState = {
  fullName: '',
  academicEmail: '',
  cpf: '',
  enrollment: '',
  dob: '',
  courseName: '',
  institution: '',
};

export default function StudentVerify() {
  const [form, setForm] = useState(initialState);
  const navigate = useNavigate();
  const { navigateToRoleDashboard } = useRoleNavigation();
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // After student verification, redirect to creator dashboard
    navigateToRoleDashboard('creator');
    // Handle form submission logic here
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted py-8 px-2 dark:bg-background relative">
        <div className="absolute top-6 right-6">
          <ThemeToggle />
        </div>
      <div className="w-full max-w-2xl bg-background rounded-xl shadow-lg p-8 md:p-12 relative border">
        <h1 className="text-2xl md:text-3xl font-bold mb-2 text-foreground">Verify your student status for free access</h1>
        <p className="text-muted-foreground mb-6 max-w-2xl text-sm md:text-base">
          Fill in the information below to validate your access as a student of the course. This guarantees access free for up to 12 months.
        </p>
        <Alert className="mb-8 flex flex-col md:flex-row items-start md:items-center gap-2 bg-[#FAF5FF] dark:bg-[#30253d]">
          <div className="flex-1">
            <AlertTitle className="font-semibold text-primary text-sm md:text-base">
              <span className="mr-2 text-[#A873E9]">ⓘ</span>Course students receive 100% free access!
            </AlertTitle>
          </div>
          <AlertDescription className="text-xs md:text-sm text-muted-foreground">
            Don't miss it.
          </AlertDescription>
        </Alert>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="fullName" className="text-xs text-muted-foreground">Full name</label>
            <Input
              id="fullName"
              name="fullName"
              type="text"
              placeholder="Your name as it appears on the course"
              value={form.fullName}
              onChange={handleChange}
              required
              autoComplete="name"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="academicEmail" className="text-xs text-muted-foreground">Academic email (course)</label>
            <Input
              id="academicEmail"
              name="academicEmail"
              type="email"
              placeholder="email@exemplo.com"
              value={form.academicEmail}
              onChange={handleChange}
              required
              autoComplete="email"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="cpf" className="text-xs text-muted-foreground">CPF</label>
            <Input
              id="cpf"
              name="cpf"
              type="text"
              placeholder="000.000.000-00"
              value={form.cpf}
              onChange={handleChange}
              required
              autoComplete="off"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="enrollment" className="text-xs text-muted-foreground">Enrollment / RA</label>
            <Input
              id="enrollment"
              name="enrollment"
              type="text"
              placeholder="Student registration number"
              value={form.enrollment}
              onChange={handleChange}
              required
              autoComplete="off"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="dob" className="text-xs text-muted-foreground">Date of birth</label>
            <Input
              id="dob"
              name="dob"
              type="text"
              placeholder="DD/MM/AAAA"
              value={form.dob}
              onChange={handleChange}
              required
              autoComplete="bday"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="courseName" className="text-xs text-muted-foreground">Course name</label>
            <Input
              id="courseName"
              name="courseName"
              type="text"
              placeholder="Digital Marketing Course, for example"
              value={form.courseName}
              onChange={handleChange}
              required
              autoComplete="off"
            />
          </div>
          <div className="md:col-span-2 flex flex-col gap-1">
            <label htmlFor="institution" className="text-xs text-muted-foreground">Name of institution</label>
            <Input
              id="institution"
              name="institution"
              type="text"
              placeholder="Full name of school/platform"
              value={form.institution}
              onChange={handleChange}
              required
              autoComplete="organization"
            />
          </div>
          <div className="md:col-span-2 mt-4">
            <Button type="submit" className="w-full md:w-auto bg-[#E91E63] text-white font-semibold px-6 py-2 rounded-lg shadow hover:bg-pink-600">
              Submit for verification
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
