import { buildLayout } from "./layout";

export default async function main(game) {
    const container = buildLayout(game.app);
    const worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });

    game.stage.aim.visible = false;
    let predictionInterval = null;

    worker.onmessage = ({ data }) => {
        const { type, x, y } = data;

        // Aguardar modelo carregar (correção para Safari)
        if (type === 'model-loaded') {
            console.log('✅ Modelo carregado! Iniciando predições...');

            // Iniciar predições SOMENTE após modelo carregar
            predictionInterval = setInterval(async () => {
                const canvas = game.app.renderer.extract.canvas(game.stage);
                const bitmap = await createImageBitmap(canvas);

                worker.postMessage({
                    type: 'predict',
                    image: bitmap,
                }, [bitmap]);
            }, 200);

            return;
        }

        if (type === 'prediction') {
            console.log(`🎯 AI predicted at: (${x}, ${y})`);
            container.updateHUD(data);
            game.stage.aim.visible = true;

            game.stage.aim.setPosition(data.x, data.y);
            const position = game.stage.aim.getGlobalPosition();

            game.handleClick({
                global: position,
            });

        }

    };

    return container;
}
