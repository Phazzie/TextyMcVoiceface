/*
  # Initial Schema for Story Voice Studio

  1. New Tables
    - `projects`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text, optional)
      - `original_text` (text)
      - `settings` (jsonb)
      - `metadata` (jsonb)
      - `tags` (text array)
      - `user_id` (uuid, references auth.users)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `characters`
      - `id` (uuid, primary key)
      - `project_id` (uuid, references projects)
      - `name` (text)
      - `voice_profile` (jsonb)
      - `characteristics` (text array)
      - `emotional_states` (text array)
      - `frequency` (integer)
      - `is_main_character` (boolean)
      - `created_at` (timestamp)
    
    - `audio_outputs`
      - `id` (uuid, primary key)
      - `project_id` (uuid, references projects)
      - `audio_url` (text)
      - `duration` (numeric)
      - `segments` (jsonb)
      - `metadata` (jsonb)
      - `created_at` (timestamp)
    
    - `writing_reports`
      - `id` (uuid, primary key)
      - `project_id` (uuid, references projects)
      - `show_tell_issues` (jsonb)
      - `trope_matches` (jsonb)
      - `purple_prose_issues` (jsonb)
      - `overall_score` (jsonb)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated and anonymous users
    - Allow anonymous users to create and manage projects in demo mode
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text,
  original_text text NOT NULL,
  settings jsonb DEFAULT '{}',
  metadata jsonb DEFAULT '{}',
  tags text[] DEFAULT '{}',
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Characters table
CREATE TABLE IF NOT EXISTS characters (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  voice_profile jsonb DEFAULT '{}',
  characteristics text[] DEFAULT '{}',
  emotional_states text[] DEFAULT '{}',
  frequency integer DEFAULT 0,
  is_main_character boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Audio outputs table
CREATE TABLE IF NOT EXISTS audio_outputs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  audio_url text,
  duration numeric DEFAULT 0,
  segments jsonb DEFAULT '[]',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Writing reports table
CREATE TABLE IF NOT EXISTS writing_reports (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  show_tell_issues jsonb DEFAULT '[]',
  trope_matches jsonb DEFAULT '[]',
  purple_prose_issues jsonb DEFAULT '[]',
  overall_score jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE audio_outputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE writing_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Projects
CREATE POLICY "Users can read own projects"
  ON projects FOR SELECT
  USING (
    auth.uid() = user_id OR 
    user_id IS NULL  -- Allow anonymous access
  );

CREATE POLICY "Users can create projects"
  ON projects FOR INSERT
  WITH CHECK (
    auth.uid() = user_id OR 
    user_id IS NULL  -- Allow anonymous users
  );

CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE
  USING (
    auth.uid() = user_id OR 
    user_id IS NULL  -- Allow anonymous access
  );

CREATE POLICY "Users can delete own projects"
  ON projects FOR DELETE
  USING (
    auth.uid() = user_id OR 
    user_id IS NULL  -- Allow anonymous access
  );

-- RLS Policies for Characters
CREATE POLICY "Users can read characters of their projects"
  ON characters FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = characters.project_id 
      AND (projects.user_id = auth.uid() OR projects.user_id IS NULL)
    )
  );

CREATE POLICY "Users can create characters for their projects"
  ON characters FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = characters.project_id 
      AND (projects.user_id = auth.uid() OR projects.user_id IS NULL)
    )
  );

CREATE POLICY "Users can update characters of their projects"
  ON characters FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = characters.project_id 
      AND (projects.user_id = auth.uid() OR projects.user_id IS NULL)
    )
  );

CREATE POLICY "Users can delete characters of their projects"
  ON characters FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = characters.project_id 
      AND (projects.user_id = auth.uid() OR projects.user_id IS NULL)
    )
  );

-- RLS Policies for Audio Outputs
CREATE POLICY "Users can read audio outputs of their projects"
  ON audio_outputs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = audio_outputs.project_id 
      AND (projects.user_id = auth.uid() OR projects.user_id IS NULL)
    )
  );

CREATE POLICY "Users can create audio outputs for their projects"
  ON audio_outputs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = audio_outputs.project_id 
      AND (projects.user_id = auth.uid() OR projects.user_id IS NULL)
    )
  );

CREATE POLICY "Users can update audio outputs of their projects"
  ON audio_outputs FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = audio_outputs.project_id 
      AND (projects.user_id = auth.uid() OR projects.user_id IS NULL)
    )
  );

CREATE POLICY "Users can delete audio outputs of their projects"
  ON audio_outputs FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = audio_outputs.project_id 
      AND (projects.user_id = auth.uid() OR projects.user_id IS NULL)
    )
  );

-- RLS Policies for Writing Reports
CREATE POLICY "Users can read writing reports of their projects"
  ON writing_reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = writing_reports.project_id 
      AND (projects.user_id = auth.uid() OR projects.user_id IS NULL)
    )
  );

CREATE POLICY "Users can create writing reports for their projects"
  ON writing_reports FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = writing_reports.project_id 
      AND (projects.user_id = auth.uid() OR projects.user_id IS NULL)
    )
  );

CREATE POLICY "Users can update writing reports of their projects"
  ON writing_reports FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = writing_reports.project_id 
      AND (projects.user_id = auth.uid() OR projects.user_id IS NULL)
    )
  );

CREATE POLICY "Users can delete writing reports of their projects"
  ON writing_reports FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = writing_reports.project_id 
      AND (projects.user_id = auth.uid() OR projects.user_id IS NULL)
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_characters_project_id ON characters(project_id);
CREATE INDEX IF NOT EXISTS idx_audio_outputs_project_id ON audio_outputs(project_id);
CREATE INDEX IF NOT EXISTS idx_writing_reports_project_id ON writing_reports(project_id);

-- Update timestamps trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();