import json
import sys
from pathlib import Path

import pytest

IXCHEL = Path(__file__).resolve().parent.parent
REPO = IXCHEL.parent
sys.path.insert(0, str(IXCHEL))

RAW = REPO / "data" / "raw"
MODELS = REPO / "models"
NOCHE_REAL = RAW / "sueno_actividad" / "bidsleep" / "Bidslab32" / "3"

requiere_datos = pytest.mark.skipif(not RAW.exists(), reason="faltan datos: python scripts/download_data.py")
requiere_modelos = pytest.mark.skipif(not (MODELS / "riesgo_rf.joblib").exists() or not (MODELS / "sueno_rf.joblib").exists(),
                                      reason="faltan modelos: entrenar_riesgo.py y modelo_sueno.py")


def a_json(x):
    """Convierte tipos numpy a tipos JSON nativos (como llegarían desde la web)."""
    return json.loads(json.dumps(x, default=lambda v: v.item() if hasattr(v, "item") else str(v)))


@pytest.fixture(scope="session")
def astronauta():
    from generador import Astronauta
    return Astronauta(7, seed=4242, entorno="Marte")
