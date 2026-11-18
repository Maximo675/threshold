import { useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router';
import { AberturaArquivo } from './components/AberturaArquivo';
import { Ambiente } from './components/Ambiente';
import { ChamadaHotline } from './components/ChamadaHotline';
import { Briefing } from './pages/Briefing';
import { Dossie } from './pages/Dossie';
import { EmConstrucao } from './pages/EmConstrucao';
import { Lantern } from './pages/Lantern';
import { Fortaleza } from './pages/Fortaleza';
import { Orientadores } from './pages/Orientadores';
import { Painel } from './pages/Painel';
import { Referencias } from './pages/Referencias';
import { Recorte } from './pages/Recorte';

const TITULOS: Record<string, string> = {
  '/': 'Briefing',
  '/dossie': 'Dossiê',
  '/recorte': 'Sala de Recorte',
  '/referencias': 'Referências',
  '/lantern': 'Lantern',
  '/orientadores': 'Orientadores',
  '/painel': 'Painel do orientador',
  '/fortaleza': 'Fortaleza',
};

/** Atualiza o <title> a cada rota (WCAG 2.4.2: página com título). */
function TituloDaPagina() {
  const { pathname } = useLocation();
  useEffect(() => {
    // '/orientadores/helena-costa' usa o título de '/orientadores'
    const titulo = TITULOS[pathname] ?? TITULOS[`/${pathname.split('/')[1]}`];
    document.title = titulo ? `${titulo} · Threshold` : 'Threshold';
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <>
      <TituloDaPagina />
      <Ambiente />
      <AberturaArquivo />
      <ChamadaHotline />
      <Routes>
        <Route path="/" element={<Briefing />} />
        <Route path="/dossie" element={<Dossie />} />
        <Route path="/recorte" element={<Recorte />} />
        <Route path="/lantern" element={<Lantern />} />
        <Route path="/orientadores" element={<Orientadores />} />
        <Route path="/orientadores/:id" element={<Orientadores />} />
        <Route path="/referencias" element={<Referencias />} />
        <Route path="/painel" element={<Painel />} />
        <Route path="/painel/:id" element={<Painel />} />
        <Route path="/fortaleza" element={<Fortaleza />} />
        <Route path="*" element={<EmConstrucao titulo="Página não encontrada" />} />
      </Routes>
    </>
  );
}
