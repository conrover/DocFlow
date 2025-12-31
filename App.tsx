
import React, { useState, useEffect } from 'react';
import { db } from './services/db';
import { DocumentRecord, DocStatus, User } from './types';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import DocumentList from './components/DocumentList';
import DocumentDetails from './components/DocumentDetails';
import AdminPanel from './components/AdminPanel';
import Auth from './components/Auth';
import Chatbot from './components/Chatbot';

type View = 'dashboard' | 'documents' | 'details' | 'admin';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [docs, setDocs] = useState<DocumentRecord[]>([]);

  useEffect(() => {
    const user = db.getCurrentUser();
    if (user) {
      setCurrentUser(user);
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      refreshDocs();
    }
  }, [currentUser]);

  const refreshDocs = () => {
    setDocs(db.getDocuments());
  };

  const navigateToDoc = (id: string) => {
    setSelectedDocId(id);
    setCurrentView('details');
  };

  const handleBack = () => {
    setCurrentView('documents');
    setSelectedDocId(null);
    refreshDocs();
  };

  const handleLogout = () => {
    db.logout();
    setCurrentUser(null);
    setCurrentView('dashboard');
    setSelectedDocId(null);
    setDocs([]);
  };

  if (!currentUser) {
    return <Auth onAuthSuccess={(user) => setCurrentUser(user)} />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 relative">
      <Sidebar 
        currentView={currentView} 
        setView={(v: View) => {
          setCurrentView(v);
          setSelectedDocId(null);
        }} 
      />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar user={currentUser} onLogout={handleLogout} />
        
        <main className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {currentView === 'dashboard' && <Dashboard docs={docs} onViewDocs={() => setCurrentView('documents')} onSelectDoc={navigateToDoc} />}
          
          {currentView === 'documents' && (
            <DocumentList 
              docs={docs} 
              onSelect={navigateToDoc} 
              onRefresh={refreshDocs} 
            />
          )}
          
          {currentView === 'details' && selectedDocId && (
            <DocumentDetails 
              docId={selectedDocId} 
              onBack={handleBack} 
            />
          )}
          
          {currentView === 'admin' && <AdminPanel />}
        </main>
      </div>

      {/* Floating AI Chatbot */}
      <Chatbot />
    </div>
  );
};

export default App;
