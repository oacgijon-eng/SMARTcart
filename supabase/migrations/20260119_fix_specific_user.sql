-- Force insert/update for the specific user reported in the screenshot
INSERT INTO public.profiles (id, name, role)
VALUES (
    'b148eefb-3569-4bef-8668-00bbdaa7d838', -- ID from screenshot
    'oacgijon@gmail.com',
    'SUPERVISOR'
)
ON CONFLICT (id) DO UPDATE
SET role = 'SUPERVISOR';
