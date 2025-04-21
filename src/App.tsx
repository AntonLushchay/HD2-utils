import React, { useState } from 'react';
import EnemyModel from './components/EnemyModel';
import enemiesData from './data/enemies.json';
import './styles/common/global.css';

// Добавляем декларацию типа для импорта .glb файлов
declare module '*.glb?url' {
  const src: string;
  export default src;
}

// Импортируем модели напрямую из папки assets (это работает в Vite)
// Для Vite правильный импорт ресурсов через ?url
import AlphaCommandeModel from './assets/models/Alpha_Commande.glb?url';
import HulkModel from './assets/models/Hulk.glb?url';
import StriderModel from './assets/models/Automaton_factory_strider.glb?url';

// Маппинг имен файлов на действительные URL ресурсов
const modelPaths: Record<string, string> = {
  'Alpha_Commande.glb': AlphaCommandeModel,
  'Hulk.glb': HulkModel,
  'Automaton_factory_strider.glb': StriderModel
};

const App: React.FC = () => {
  const [selectedEnemy, setSelectedEnemy] = useState(enemiesData[0]);
  const [modelPath, setModelPath] = useState(modelPaths[enemiesData[0].modelPath] || '');
  const [modelAvailable, setModelAvailable] = useState(true);

  const handleModelChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const enemyId = event.target.value;
    const enemy = enemiesData.find(e => e.id === enemyId);
    if (enemy) {
      setSelectedEnemy(enemy);
      const path = modelPaths[enemy.modelPath];
      setModelPath(path || '');
      setModelAvailable(!!path);
    }
  };

  return (
    <div className="app-container">
      <div className="header">
        <h1>HD2-utils: 3D Model Viewer</h1>
        <div className="model-selector">
          <label htmlFor="model-select">Выберите модель: </label>
          <select 
            id="model-select" 
            value={selectedEnemy.id} 
            onChange={handleModelChange}
            className="model-dropdown"
          >
            {enemiesData.map(enemy => (
              <option key={enemy.id} value={enemy.id}>{enemy.name}</option>
            ))}
          </select>
        </div>
      </div>
      <EnemyModel 
        modelPath={modelPath}
        modelAvailable={modelAvailable}
        characteristics={selectedEnemy.characteristics as any} // временный фикс типов
      />
    </div>
  );
};

export default App;
