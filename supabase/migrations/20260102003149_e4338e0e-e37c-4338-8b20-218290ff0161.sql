-- Create classrooms table
CREATE TABLE public.classrooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  hub TEXT NOT NULL,
  teacher_id UUID NOT NULL,
  cover_image_url TEXT,
  max_students INTEGER DEFAULT 50,
  is_public BOOLEAN DEFAULT true,
  enrollment_code TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create classroom_enrollments table
CREATE TABLE public.classroom_enrollments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  classroom_id UUID NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT DEFAULT 'student',
  enrolled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(classroom_id, user_id)
);

-- Create lessons table
CREATE TABLE public.lessons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  classroom_id UUID NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT,
  video_url TEXT,
  order_index INTEGER DEFAULT 0,
  duration_minutes INTEGER,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create lesson_progress table
CREATE TABLE public.lesson_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  completed BOOLEAN DEFAULT false,
  progress_percent INTEGER DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE,
  last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(lesson_id, user_id)
);

-- Create assignments table
CREATE TABLE public.assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  classroom_id UUID NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMP WITH TIME ZONE,
  max_score INTEGER DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create assignment_submissions table
CREATE TABLE public.assignment_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT,
  file_url TEXT,
  score INTEGER,
  feedback TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  graded_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(assignment_id, user_id)
);

-- Enable RLS
ALTER TABLE public.classrooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classroom_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;

-- Classrooms policies
CREATE POLICY "Public classrooms viewable by everyone"
ON public.classrooms FOR SELECT
USING (is_public = true);

CREATE POLICY "Teachers can view their classrooms"
ON public.classrooms FOR SELECT
USING (auth.uid() = teacher_id);

CREATE POLICY "Enrolled users can view classrooms"
ON public.classrooms FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.classroom_enrollments
    WHERE classroom_id = classrooms.id AND user_id = auth.uid()
  )
);

CREATE POLICY "Authenticated users can create classrooms"
ON public.classrooms FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = teacher_id);

CREATE POLICY "Teachers can update their classrooms"
ON public.classrooms FOR UPDATE
USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can delete their classrooms"
ON public.classrooms FOR DELETE
USING (auth.uid() = teacher_id);

-- Classroom enrollments policies
CREATE POLICY "Enrollments viewable by classroom participants"
ON public.classroom_enrollments FOR SELECT
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM public.classrooms
    WHERE id = classroom_enrollments.classroom_id AND teacher_id = auth.uid()
  )
);

CREATE POLICY "Users can enroll in classrooms"
ON public.classroom_enrollments FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Teachers can manage enrollments"
ON public.classroom_enrollments FOR DELETE
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM public.classrooms
    WHERE id = classroom_enrollments.classroom_id AND teacher_id = auth.uid()
  )
);

-- Lessons policies
CREATE POLICY "Published lessons viewable by enrolled users"
ON public.lessons FOR SELECT
USING (
  is_published = true AND
  EXISTS (
    SELECT 1 FROM public.classroom_enrollments
    WHERE classroom_id = lessons.classroom_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Teachers can view all lessons"
ON public.lessons FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.classrooms
    WHERE id = lessons.classroom_id AND teacher_id = auth.uid()
  )
);

CREATE POLICY "Teachers can create lessons"
ON public.lessons FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.classrooms
    WHERE id = lessons.classroom_id AND teacher_id = auth.uid()
  )
);

CREATE POLICY "Teachers can update lessons"
ON public.lessons FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.classrooms
    WHERE id = lessons.classroom_id AND teacher_id = auth.uid()
  )
);

CREATE POLICY "Teachers can delete lessons"
ON public.lessons FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.classrooms
    WHERE id = lessons.classroom_id AND teacher_id = auth.uid()
  )
);

-- Lesson progress policies
CREATE POLICY "Users can view own progress"
ON public.lesson_progress FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Teachers can view student progress"
ON public.lesson_progress FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.lessons l
    JOIN public.classrooms c ON c.id = l.classroom_id
    WHERE l.id = lesson_progress.lesson_id AND c.teacher_id = auth.uid()
  )
);

CREATE POLICY "Users can update own progress"
ON public.lesson_progress FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their progress"
ON public.lesson_progress FOR UPDATE
USING (auth.uid() = user_id);

-- Assignments policies
CREATE POLICY "Enrolled users can view assignments"
ON public.assignments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.classroom_enrollments
    WHERE classroom_id = assignments.classroom_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Teachers can view all assignments"
ON public.assignments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.classrooms
    WHERE id = assignments.classroom_id AND teacher_id = auth.uid()
  )
);

CREATE POLICY "Teachers can create assignments"
ON public.assignments FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.classrooms
    WHERE id = assignments.classroom_id AND teacher_id = auth.uid()
  )
);

CREATE POLICY "Teachers can update assignments"
ON public.assignments FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.classrooms
    WHERE id = assignments.classroom_id AND teacher_id = auth.uid()
  )
);

CREATE POLICY "Teachers can delete assignments"
ON public.assignments FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.classrooms
    WHERE id = assignments.classroom_id AND teacher_id = auth.uid()
  )
);

-- Submission policies
CREATE POLICY "Users can view own submissions"
ON public.assignment_submissions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Teachers can view all submissions"
ON public.assignment_submissions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.assignments a
    JOIN public.classrooms c ON c.id = a.classroom_id
    WHERE a.id = assignment_submissions.assignment_id AND c.teacher_id = auth.uid()
  )
);

CREATE POLICY "Users can submit assignments"
ON public.assignment_submissions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own submissions"
ON public.assignment_submissions FOR UPDATE
USING (auth.uid() = user_id AND graded_at IS NULL);

CREATE POLICY "Teachers can grade submissions"
ON public.assignment_submissions FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.assignments a
    JOIN public.classrooms c ON c.id = a.classroom_id
    WHERE a.id = assignment_submissions.assignment_id AND c.teacher_id = auth.uid()
  )
);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.classrooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.lessons;
ALTER PUBLICATION supabase_realtime ADD TABLE public.assignments;