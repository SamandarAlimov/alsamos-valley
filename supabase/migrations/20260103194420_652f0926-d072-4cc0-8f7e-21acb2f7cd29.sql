-- Create research labs table
CREATE TABLE public.research_labs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  field TEXT NOT NULL, -- chemistry, biology, physics, engineering, medicine, etc.
  research_focus TEXT[], -- specific research areas
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  hub TEXT,
  is_public BOOLEAN DEFAULT true,
  max_members INTEGER DEFAULT 20,
  equipment JSONB DEFAULT '[]'::jsonb, -- virtual equipment/tools available
  status TEXT DEFAULT 'active', -- active, paused, completed
  funding_status TEXT DEFAULT 'seeking', -- seeking, funded, self-funded
  publications_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create lab members table
CREATE TABLE public.lab_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lab_id UUID NOT NULL REFERENCES public.research_labs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT DEFAULT 'researcher', -- lead, researcher, assistant, observer
  specialization TEXT,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(lab_id, user_id)
);

-- Create research projects table
CREATE TABLE public.research_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lab_id UUID NOT NULL REFERENCES public.research_labs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  hypothesis TEXT,
  methodology TEXT,
  status TEXT DEFAULT 'planning', -- planning, in_progress, analysis, completed, published
  start_date DATE,
  end_date DATE,
  findings TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.research_labs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_projects ENABLE ROW LEVEL SECURITY;

-- Research labs policies
CREATE POLICY "Public labs viewable by everyone" ON public.research_labs
  FOR SELECT USING (is_public = true);

CREATE POLICY "Lab owners can view their labs" ON public.research_labs
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Lab members can view their labs" ON public.research_labs
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM lab_members WHERE lab_members.lab_id = research_labs.id AND lab_members.user_id = auth.uid()
  ));

CREATE POLICY "Authenticated users can create labs" ON public.research_labs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = owner_id);

CREATE POLICY "Lab owners can update their labs" ON public.research_labs
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Lab owners can delete their labs" ON public.research_labs
  FOR DELETE USING (auth.uid() = owner_id);

-- Lab members policies
CREATE POLICY "Lab members viewable by lab participants" ON public.lab_members
  FOR SELECT USING (
    auth.uid() = user_id OR 
    EXISTS (SELECT 1 FROM lab_members lm WHERE lm.lab_id = lab_members.lab_id AND lm.user_id = auth.uid())
  );

CREATE POLICY "Users can join labs" ON public.lab_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave labs" ON public.lab_members
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Lab leads can manage members" ON public.lab_members
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM lab_members lm 
    WHERE lm.lab_id = lab_members.lab_id 
    AND lm.user_id = auth.uid() 
    AND lm.role = 'lead'
  ));

-- Research projects policies
CREATE POLICY "Projects viewable by lab members" ON public.research_projects
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM lab_members WHERE lab_members.lab_id = research_projects.lab_id AND lab_members.user_id = auth.uid()
  ));

CREATE POLICY "Public projects viewable by everyone" ON public.research_projects
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM research_labs WHERE research_labs.id = research_projects.lab_id AND research_labs.is_public = true
  ));

CREATE POLICY "Lab members can create projects" ON public.research_projects
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM lab_members WHERE lab_members.lab_id = research_projects.lab_id AND lab_members.user_id = auth.uid()
  ));

CREATE POLICY "Lab leads can update projects" ON public.research_projects
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM lab_members 
    WHERE lab_members.lab_id = research_projects.lab_id 
    AND lab_members.user_id = auth.uid() 
    AND lab_members.role IN ('lead', 'researcher')
  ));

CREATE POLICY "Lab leads can delete projects" ON public.research_projects
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM lab_members 
    WHERE lab_members.lab_id = research_projects.lab_id 
    AND lab_members.user_id = auth.uid() 
    AND lab_members.role = 'lead'
  ));

-- Create trigger for updated_at
CREATE TRIGGER update_research_labs_updated_at
  BEFORE UPDATE ON public.research_labs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_research_projects_updated_at
  BEFORE UPDATE ON public.research_projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.research_labs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.lab_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.research_projects;