--
-- PostgreSQL database dump
--

\restrict 0T2Tk9fKbzJjWJgU7cLtjVezmMragbZczP5HeYGQyUfzY4PmDMjfqO4Jfka4QnU

-- Dumped from database version 15.14 (Debian 15.14-1.pgdg13+1)
-- Dumped by pg_dump version 15.14 (Debian 15.14-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: user
--

INSERT INTO public."User" VALUES ('a853d480-abcb-43cb-a327-1548c7134749', 'test@test.com', 'testuser', '$2b$10$cYvr4TvTK7OsShZWiDilWufuuTt5MllXR1pSJo0nujeM12Q.CNgW2', NULL, '2026-03-21 16:29:17.183', NULL);
INSERT INTO public."User" VALUES ('c114d7c8-c3f4-4ebc-b160-4bcbdd590c1c', 'Kristina@yahoo.com', 'test-user-2', '$2b$10$qGtKry6RiJqVvS2VY.Xece8W91KFi4EVQd0AV6fAuhZNI0zAsqVi2', NULL, '2026-03-21 17:14:17.856', NULL);
INSERT INTO public."User" VALUES ('0ecabdd1-b204-41c1-b5d3-f2a3b536ab7e', 'Kristina@gmail.com', 'test-user-3', '$2b$10$ru0i0MGjdT0.SQNnZwIsIOs7afcV5QZWOWj6NAONB.RrrZKBzXbkS', NULL, '2026-03-21 17:15:25.414', NULL);
INSERT INTO public."User" VALUES ('9e3fc2cd-6b1d-4a68-a344-20c4b365180a', 'Kristina1@gmail.com', 'test-user-4', '$2b$10$cn693lp7ndqAXIOmLc1t8uvEgriAH3agE7a/.OG6X4RUJLRQm1B5a', NULL, '2026-03-21 17:19:08.424', NULL);
INSERT INTO public."User" VALUES ('a03d5037-a41a-4b11-b898-df5b9e03677d', 'adawdawd@dwd.wdwd', 'adwaqwqd', '$2b$10$Poo5y9udN/tlhVh0hi2A6ePRXSj/vPhFyHP9JyU2gJQ7c4sbfKdlu', NULL, '2026-03-21 17:22:54.922', NULL);
INSERT INTO public."User" VALUES ('dcc3ad0b-8582-4794-88fc-d619a6221ce7', 'EfaEWfadwdaw@adqw.dww', 'd3wqdq2wdq', '$2b$10$RuRHZg0EiZLJ0Xa9oMYtq.yktzFR/GWwMJZeZ554YwF0juEzUhUPy', NULL, '2026-03-21 17:25:06.22', NULL);
INSERT INTO public."User" VALUES ('2421d2af-c9dd-411b-a46a-cc40263eecc5', 'kristinagaranchuk@gmail.com', 'Alaska_999', '$2b$10$e.BryA.EitFFveyfdDBfbe4qi5OKOqo343ZHMnwod/8En/BLyxB6m', NULL, '2026-03-21 16:29:35.277', '$2b$10$CtSt/Z3m2a7gv80C8q0twuKuJqUnkQRUix3jd02RaUKsUYmMAIhOC');


--
-- Data for Name: Module; Type: TABLE DATA; Schema: public; Owner: user
--

INSERT INTO public."Module" VALUES ('711c2205-1cad-4c2b-be3c-4fd3460f99b7', 'm1', '2026-05-20 16:51:21.351', '2026-05-20 16:51:21.351', false, '2421d2af-c9dd-411b-a46a-cc40263eecc5', NULL);
INSERT INTO public."Module" VALUES ('7bd3475e-6506-429d-b41a-6279ca3c607f', 'IT & Web Development', '2026-05-20 16:53:04.947', '2026-05-20 16:53:04.947', false, '2421d2af-c9dd-411b-a46a-cc40263eecc5', NULL);
INSERT INTO public."Module" VALUES ('cbae8245-1728-401c-b0e7-af127600eb7b', 'Idioms & Phrasal Verbs', '2026-05-20 16:57:06.111', '2026-05-26 17:54:18.091', true, '2421d2af-c9dd-411b-a46a-cc40263eecc5', NULL);
INSERT INTO public."Module" VALUES ('7f9f9b4a-8612-4968-9140-9da1ad534539', 'Idioms & Phrasal Verbs v2', '2026-05-20 16:59:22.632', '2026-06-06 10:31:17.342', false, '2421d2af-c9dd-411b-a46a-cc40263eecc5', NULL);
INSERT INTO public."Module" VALUES ('1610bbab-2f2b-4ac6-bbe3-6e4c9167cc44', 'Test', '2026-06-06 10:32:53.956', '2026-06-06 10:32:53.956', false, '2421d2af-c9dd-411b-a46a-cc40263eecc5', NULL);
INSERT INTO public."Module" VALUES ('82c8d07d-6eeb-4445-8a87-7088ee6c7846', 'Swede', '2026-06-06 10:35:35.808', '2026-06-06 10:35:35.808', false, '2421d2af-c9dd-411b-a46a-cc40263eecc5', NULL);


--
-- Data for Name: Flashcard; Type: TABLE DATA; Schema: public; Owner: user
--

INSERT INTO public."Flashcard" VALUES ('4f96fb2a-ff81-46cb-b422-0cf8cf94c48d', 'Hello', 'World', '2026-05-20 16:51:21.351', '2026-05-20 16:51:21.351', false, 'UNSTUDIED', '711c2205-1cad-4c2b-be3c-4fd3460f99b7');
INSERT INTO public."Flashcard" VALUES ('679e6af1-4820-4a0f-ba1e-1a2c3c680bbd', '', '', '2026-05-20 16:51:21.351', '2026-05-20 16:51:21.351', false, 'UNSTUDIED', '711c2205-1cad-4c2b-be3c-4fd3460f99b7');
INSERT INTO public."Flashcard" VALUES ('8283f3cf-eb17-41af-8dbf-c71f2043080b', 'State', 'An object that holds information about the current situation of a component in React/Expo.', '2026-05-20 16:53:04.947', '2026-05-20 16:53:04.947', false, 'UNSTUDIED', '7bd3475e-6506-429d-b41a-6279ca3c607f');
INSERT INTO public."Flashcard" VALUES ('8fec8d7a-c09c-4717-9118-377a029e04f7', 'Middleware', 'Code that executes between receiving a request and sending a response on the server.', '2026-05-20 16:53:04.947', '2026-05-20 16:53:04.947', false, 'UNSTUDIED', '7bd3475e-6506-429d-b41a-6279ca3c607f');
INSERT INTO public."Flashcard" VALUES ('7bbbded3-10ad-4213-8059-5116fbb32d67', 'Bite the bullet', 'Мужньо прийняти важке рішення або пройти через неприємну ситуацію.', '2026-05-20 16:57:06.111', '2026-05-20 16:57:06.111', false, 'UNSTUDIED', 'cbae8245-1728-401c-b0e7-af127600eb7b');
INSERT INTO public."Flashcard" VALUES ('4ff1ff9a-5957-485a-9cef-84e62af528e3', 'Break a leg', 'Побажання удачі (зазвичай перед виступом або іспитом).', '2026-05-20 16:57:06.111', '2026-05-20 16:57:06.111', false, 'UNSTUDIED', 'cbae8245-1728-401c-b0e7-af127600eb7b');
INSERT INTO public."Flashcard" VALUES ('ec2cf8f5-ed3c-4f32-91d4-7907c500b615', 'Call it a day', 'Зупинити роботу над чимось, завершити справу на сьогодні.', '2026-05-20 16:57:06.111', '2026-05-20 16:57:06.111', false, 'UNSTUDIED', 'cbae8245-1728-401c-b0e7-af127600eb7b');
INSERT INTO public."Flashcard" VALUES ('9240f979-2628-42a6-bc15-09fd78f51f69', 'Hit the sack', 'Лягати спати через сильну втому.', '2026-05-20 16:57:06.111', '2026-05-20 16:57:06.111', false, 'UNSTUDIED', 'cbae8245-1728-401c-b0e7-af127600eb7b');
INSERT INTO public."Flashcard" VALUES ('d51ded6c-5e38-4625-8267-3a7e2a201b55', 'Under the weather', 'Почуватися трохи хворим або втомленим.', '2026-05-20 16:57:06.111', '2026-05-20 16:57:06.111', false, 'UNSTUDIED', 'cbae8245-1728-401c-b0e7-af127600eb7b');
INSERT INTO public."Flashcard" VALUES ('0d4afc87-1be3-486d-a146-0f35dc59466b', 'Database Index', 'A data structure that improves the speed of data retrieval operations on a database table.', '2026-05-20 16:53:04.947', '2026-05-26 16:55:14.026', false, 'UNSTUDIED', '7bd3475e-6506-429d-b41a-6279ca3c607f');
INSERT INTO public."Flashcard" VALUES ('cc12d0c1-2c0e-4e92-8ba9-d8e4bcf88dff', 'API', 'A set of rules that allows different applications to communicate with each other.', '2026-05-20 16:53:04.947', '2026-05-26 16:55:15.113', true, 'UNSTUDIED', '7bd3475e-6506-429d-b41a-6279ca3c607f');
INSERT INTO public."Flashcard" VALUES ('e6f98fc1-8dd0-4738-9f67-91a0cbcc568f', 'Hydration', 'The process of mapping server-rendered HTML into client-side JavaScript components.', '2026-05-20 16:53:04.947', '2026-05-26 16:55:16.029', true, 'UNSTUDIED', '7bd3475e-6506-429d-b41a-6279ca3c607f');
INSERT INTO public."Flashcard" VALUES ('c5949179-468c-48d6-9e25-10c077d12156', 'Bite the bullet', 'Мужньо прийняти важке рішення або пройти через неприємну ситуацію.', '2026-05-20 16:59:22.632', '2026-06-06 10:31:17.339', false, 'UNSTUDIED', '7f9f9b4a-8612-4968-9140-9da1ad534539');
INSERT INTO public."Flashcard" VALUES ('b2cbba63-b3c8-4907-9cbf-2bf0af3e311d', 'Call it a day', 'Зупинити роботу над чимось, завершити справу на сьогодні.', '2026-05-20 16:59:22.632', '2026-06-06 10:31:17.339', false, 'UNSTUDIED', '7f9f9b4a-8612-4968-9140-9da1ad534539');
INSERT INTO public."Flashcard" VALUES ('bcc6b677-9ba6-46d0-b93c-fe5cc4ce62a8', 'Break a leg', 'Побажання удачі (зазвичай перед виступом або іспитом).', '2026-05-20 16:59:22.632', '2026-06-06 10:31:17.339', false, 'UNSTUDIED', '7f9f9b4a-8612-4968-9140-9da1ad534539');
INSERT INTO public."Flashcard" VALUES ('5b998280-f379-466e-9109-003abec3e72f', 'Under the weather', 'Почуватися трохи хворим або втомленим.', '2026-05-20 16:59:22.632', '2026-06-06 10:31:17.337', false, 'UNSTUDIED', '7f9f9b4a-8612-4968-9140-9da1ad534539');
INSERT INTO public."Flashcard" VALUES ('9a191853-a930-4ccc-9269-7e9aadc8f7fe', 'Hit the sack', 'Лягати спати через сильну втому.', '2026-05-20 16:59:22.632', '2026-06-06 10:31:17.34', false, 'UNSTUDIED', '7f9f9b4a-8612-4968-9140-9da1ad534539');
INSERT INTO public."Flashcard" VALUES ('c85a6b82-466a-4289-a709-76852e8a7208', 'Test', 'Test', '2026-06-06 10:32:53.956', '2026-06-06 10:32:53.956', false, 'UNSTUDIED', '1610bbab-2f2b-4ac6-bbe3-6e4c9167cc44');
INSERT INTO public."Flashcard" VALUES ('752590bc-6736-4934-9ecc-a4a51bb02be7', '', '', '2026-06-06 10:32:53.956', '2026-06-06 10:32:53.956', false, 'UNSTUDIED', '1610bbab-2f2b-4ac6-bbe3-6e4c9167cc44');
INSERT INTO public."Flashcard" VALUES ('e7f3f31e-4885-4f1d-b40a-c36d01bc1510', 'Deed', '', '2026-06-06 10:35:35.808', '2026-06-06 10:35:35.808', false, 'UNSTUDIED', '82c8d07d-6eeb-4445-8a87-7088ee6c7846');


--
-- Data for Name: Folder; Type: TABLE DATA; Schema: public; Owner: user
--

INSERT INTO public."Folder" VALUES ('23328ca2-f26d-4abb-95aa-0839b3f080d0', 'Web development', 'file:///Users/user/Library/Developer/CoreSimulator/Devices/37A02ABC-344A-4955-92BE-C7D297443820/data/Containers/Data/Application/AF1DFB19-4BF2-4F3D-8D6C-6A5C2C7E0150/Library/Caches/ExponentExperienceData/@anonymous/appside-down-d77d7244-30b1-4191-8f87-db7a7e735468/ImagePicker/913BC587-8C02-426C-AE60-710459E6509D.jpg', '2026-05-20 16:55:59.224', '2026-05-20 16:55:59.224', '2421d2af-c9dd-411b-a46a-cc40263eecc5', '{}');
INSERT INTO public."Folder" VALUES ('704fba2c-18d8-403e-a279-5f0b6568739f', 'Spanish', 'file:///Users/user/Library/Developer/CoreSimulator/Devices/37A02ABC-344A-4955-92BE-C7D297443820/data/Containers/Data/Application/AF1DFB19-4BF2-4F3D-8D6C-6A5C2C7E0150/Library/Caches/ExponentExperienceData/@anonymous/appside-down-d77d7244-30b1-4191-8f87-db7a7e735468/ImagePicker/7F8957FD-7C19-44B7-BA89-2F51272CB760.jpg', '2026-05-26 16:22:29.832', '2026-05-26 16:24:28.557', '2421d2af-c9dd-411b-a46a-cc40263eecc5', '{"tag 1"}');
INSERT INTO public."Folder" VALUES ('5ba3996b-5f84-4161-9a7a-50f5a63e62ce', 'English', '', '2026-05-20 16:53:43.454', '2026-06-09 20:32:55.752', '2421d2af-c9dd-411b-a46a-cc40263eecc5', '{Test}');


--
-- Data for Name: _FolderToModule; Type: TABLE DATA; Schema: public; Owner: user
--

INSERT INTO public."_FolderToModule" VALUES ('5ba3996b-5f84-4161-9a7a-50f5a63e62ce', '711c2205-1cad-4c2b-be3c-4fd3460f99b7');
INSERT INTO public."_FolderToModule" VALUES ('23328ca2-f26d-4abb-95aa-0839b3f080d0', '7bd3475e-6506-429d-b41a-6279ca3c607f');
INSERT INTO public."_FolderToModule" VALUES ('5ba3996b-5f84-4161-9a7a-50f5a63e62ce', 'cbae8245-1728-401c-b0e7-af127600eb7b');
INSERT INTO public."_FolderToModule" VALUES ('704fba2c-18d8-403e-a279-5f0b6568739f', '82c8d07d-6eeb-4445-8a87-7088ee6c7846');
INSERT INTO public."_FolderToModule" VALUES ('5ba3996b-5f84-4161-9a7a-50f5a63e62ce', '7bd3475e-6506-429d-b41a-6279ca3c607f');


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: user
--

INSERT INTO public._prisma_migrations VALUES ('0ebdd589-3574-4952-b068-7c804e7a5d29', 'e7d0606b518a74e8fd09b2ad1ecb65ea3e133d3aa0d221dc4d867bbdb0d2a261', '2026-03-21 15:35:46.284541+00', '20260321153546_init_user', NULL, NULL, '2026-03-21 15:35:46.278373+00', 1);
INSERT INTO public._prisma_migrations VALUES ('eb4cbb18-20d4-421b-b9ca-2a8c9adbf38e', '9a66bb1fe58646ac67bf64cc0968e79db90c3fd03fce18187a9c30f0c616dc0b', '2026-03-22 11:19:11.638992+00', '20260322111911_add_hashed_rt', NULL, NULL, '2026-03-22 11:19:11.635152+00', 1);
INSERT INTO public._prisma_migrations VALUES ('1b15e22f-c7d0-4aeb-b37f-23466b2c5459', '283e2796604f3c1b7a22091ebf18e797d19c796e8cee4fbab1044a010af53ca4', '2026-03-31 17:02:26.560384+00', '20260331170226_add_folders_modules_cards', NULL, NULL, '2026-03-31 17:02:26.529301+00', 1);
INSERT INTO public._prisma_migrations VALUES ('716d0a56-d881-4867-93d7-7a7c918ba760', 'a33724f3f19dbbbf5689541f19f0cac9f1313e0ae2a1496dbc2824738bd5ece7', '2026-05-20 15:20:56.227635+00', '20260520152056_change_folder_module_to_m2m', NULL, NULL, '2026-05-20 15:20:56.214351+00', 1);


--
-- PostgreSQL database dump complete
--

\unrestrict 0T2Tk9fKbzJjWJgU7cLtjVezmMragbZczP5HeYGQyUfzY4PmDMjfqO4Jfka4QnU

