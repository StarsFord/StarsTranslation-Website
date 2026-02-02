import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import PostDetail from './pages/PostDetail';
import Login from './pages/Login';
import AuthCallback from './pages/AuthCallback';
import AdminDashboard from './pages/AdminDashboard';
import PostEditor from './pages/PostEditor';
import Search from './pages/Search';
import TagsManagement from './pages/TagsManagement';
import UsersManagement from './pages/UsersManagement';
import Following from './pages/Following';
import AdSense from './pages/AdSense';

function App() {
  return (
    <div className="app">
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/category/:category" element={<Home />} />
          <Route path="/search" element={<Search />} />
          <Route path="/following" element={<Following />} />
          <Route path="/post/:slug" element={<PostDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/post/new" element={<PostEditor />} />
          <Route path="/admin/post/edit/:id" element={<PostEditor />} />
          <Route path="/admin/tags" element={<TagsManagement />} />
          <Route path="/admin/users" element={<UsersManagement />} />
          <Route path="/adsense/:attachmentId" element={<AdSense />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;
