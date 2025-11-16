# TensorFlow

## Informações Básicas

- **Nome:** tensorflow
- **Categoria:** Deep Learning, Neural Networks, Machine Learning, AI
- **Versão Mínima:** 2.10.0
- **Versão Recomendada:** 2.15.0+
- **Licença:** Apache 2.0
- **Documentação:** https://www.tensorflow.org/

## Descrição

TensorFlow é a plataforma de deep learning mais popular e madura do mundo, desenvolvida pelo Google. Oferece ecossistema completo para construir, treinar e implantar modelos de machine learning, desde redes neurais simples até arquiteturas complexas como transformers. Suporta CPUs, GPUs e TPUs, com APIs de alto nível (Keras) e baixo nível para máximo controle.

## Casos de Uso Prioritários

1. **Deep Learning / Neural Networks** (confidence: 0.98)
2. **Computer Vision (CNNs)** (confidence: 0.95)
3. **Natural Language Processing (RNNs, Transformers)** (confidence: 0.95)
4. **Time Series Forecasting** (confidence: 0.90)
5. **Reinforcement Learning** (confidence: 0.88)
6. **Generative Models (GANs, VAEs)** (confidence: 0.92)
7. **Transfer Learning** (confidence: 0.95)
8. **Model Deployment (TF Serving, TF Lite)** (confidence: 0.93)
9. **AutoML e Neural Architecture Search** (confidence: 0.85)
10. **Production ML at Scale** (confidence: 0.95)

## Prós

- ✅ Ecossistema mais completo de ML/DL
- ✅ Production-ready (TF Serving, TF Lite, TF.js)
- ✅ Suporte GPU/TPU nativo e otimizado
- ✅ Keras API de alto nível (fácil de usar)
- ✅ TensorBoard para visualização
- ✅ Distributed training built-in
- ✅ Mobile deployment (TF Lite)
- ✅ Browser deployment (TensorFlow.js)
- ✅ Documentação massiva e comunidade gigante
- ✅ Mantido pelo Google com updates constantes
- ✅ Integração com Google Cloud, Vertex AI
- ✅ SavedModel format universal

## Contras

- ⚠️ Curva de aprendizado moderada-alta
- ⚠️ Overhead maior que PyTorch para pesquisa
- ⚠️ APIs de baixo nível podem ser verbosas
- ⚠️ Debugging mais difícil que PyTorch
- ⚠️ Instalação grande (~500MB-2GB)
- ⚠️ Compatibilidade entre versões pode quebrar
- ⚠️ Menos flexível que PyTorch para custom ops

## Performance

- **Velocidade:** ⭐⭐⭐⭐⭐ (9.5/10)
- **Uso de Memória:** ⭐⭐⭐⭐ (8/10)
- **Qualidade de Output:** ⭐⭐⭐⭐⭐ (10/10)
- **Facilidade de Uso:** ⭐⭐⭐⭐ (8/10)

## Instalação

```bash
# CPU only
pip install tensorflow

# GPU support (CUDA required)
pip install tensorflow[and-cuda]

# Ou versão específica
pip install tensorflow==2.15.0

# Com extras
pip install tensorflow tensorflow-datasets tensorflow-hub
```

## Keywords/Triggers

- tensorflow
- keras
- deep learning
- neural network
- cnn
- rnn
- lstm
- transformer
- gpt
- bert
- computer vision
- nlp
- image classification
- object detection
- transfer learning
- model training
- gpu acceleration
- production ml

## Exemplos de Código

### Básico: Classificação de Imagens com Keras

```python
import tensorflow as tf
from tensorflow import keras
import numpy as np

def train_image_classifier(train_images, train_labels, num_classes=10):
    """Treina classificador de imagens simples"""
    
    # Normalizar dados
    train_images = train_images.astype('float32') / 255.0
    
    # Criar modelo
    model = keras.Sequential([
        keras.layers.Flatten(input_shape=(28, 28)),
        keras.layers.Dense(128, activation='relu'),
        keras.layers.Dropout(0.2),
        keras.layers.Dense(num_classes, activation='softmax')
    ])
    
    # Compilar
    model.compile(
        optimizer='adam',
        loss='sparse_categorical_crossentropy',
        metrics=['accuracy']
    )
    
    # Treinar
    history = model.fit(
        train_images, 
        train_labels,
        epochs=10,
        validation_split=0.2,
        verbose=1
    )
    
    return {
        'model': model,
        'accuracy': float(history.history['accuracy'][-1]),
        'val_accuracy': float(history.history['val_accuracy'][-1]),
        'epochs': len(history.history['accuracy'])
    }
```

### Intermediário: CNN para Computer Vision

```python
import tensorflow as tf
from tensorflow import keras

def build_cnn_model(input_shape=(224, 224, 3), num_classes=10):
    """Constrói CNN para classificação de imagens"""
    
    model = keras.Sequential([
        # Convolutional blocks
        keras.layers.Conv2D(32, (3, 3), activation='relu', input_shape=input_shape),
        keras.layers.MaxPooling2D((2, 2)),
        
        keras.layers.Conv2D(64, (3, 3), activation='relu'),
        keras.layers.MaxPooling2D((2, 2)),
        
        keras.layers.Conv2D(128, (3, 3), activation='relu'),
        keras.layers.MaxPooling2D((2, 2)),
        
        # Dense layers
        keras.layers.Flatten(),
        keras.layers.Dense(128, activation='relu'),
        keras.layers.Dropout(0.5),
        keras.layers.Dense(num_classes, activation='softmax')
    ])
    
    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=0.001),
        loss='categorical_crossentropy',
        metrics=['accuracy']
    )
    
    return model

def train_with_augmentation(model, train_data, val_data, epochs=50):
    """Treina com data augmentation"""
    
    # Data augmentation
    data_augmentation = keras.Sequential([
        keras.layers.RandomFlip("horizontal"),
        keras.layers.RandomRotation(0.1),
        keras.layers.RandomZoom(0.1),
    ])
    
    # Callbacks
    callbacks = [
        keras.callbacks.EarlyStopping(patience=5, restore_best_weights=True),
        keras.callbacks.ReduceLROnPlateau(factor=0.5, patience=3),
        keras.callbacks.ModelCheckpoint('best_model.h5', save_best_only=True)
    ]
    
    # Treinar
    history = model.fit(
        train_data,
        validation_data=val_data,
        epochs=epochs,
        callbacks=callbacks
    )
    
    return history
```

### Avançado: Transfer Learning com Modelos Pré-treinados

```python
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras.applications import ResNet50

def create_transfer_learning_model(num_classes=10, trainable_layers=0):
    """Transfer learning com ResNet50"""
    
    # Carregar modelo pré-treinado (sem top layer)
    base_model = ResNet50(
        weights='imagenet',
        include_top=False,
        input_shape=(224, 224, 3)
    )
    
    # Congelar camadas base (exceto últimas se especificado)
    base_model.trainable = False
    if trainable_layers > 0:
        # Descongelar últimas N camadas
        for layer in base_model.layers[-trainable_layers:]:
            layer.trainable = True
    
    # Adicionar camadas customizadas
    model = keras.Sequential([
        base_model,
        keras.layers.GlobalAveragePooling2D(),
        keras.layers.Dense(256, activation='relu'),
        keras.layers.Dropout(0.5),
        keras.layers.Dense(num_classes, activation='softmax')
    ])
    
    # Compilar com learning rate baixo (fine-tuning)
    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=1e-4),
        loss='categorical_crossentropy',
        metrics=['accuracy', 'top_k_categorical_accuracy']
    )
    
    return model

def fine_tune_model(model, train_data, val_data):
    """Fine-tuning em duas fases"""
    
    # Fase 1: Treinar apenas top layers
    print("Fase 1: Treinando top layers...")
    history1 = model.fit(
        train_data,
        validation_data=val_data,
        epochs=10
    )
    
    # Fase 2: Descongelar e treinar com LR menor
    print("Fase 2: Fine-tuning com base model...")
    model.layers[0].trainable = True
    
    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=1e-5),
        loss='categorical_crossentropy',
        metrics=['accuracy']
    )
    
    history2 = model.fit(
        train_data,
        validation_data=val_data,
        epochs=20,
        callbacks=[
            keras.callbacks.EarlyStopping(patience=5),
            keras.callbacks.ReduceLROnPlateau(factor=0.2, patience=3)
        ]
    )
    
    return model, (history1, history2)
```

### Expert: Custom Training Loop com GradientTape

```python
import tensorflow as tf
from tensorflow import keras
import numpy as np

def custom_training_loop(model, train_dataset, val_dataset, epochs=10):
    """Training loop customizado com GradientTape"""
    
    # Otimizador e loss
    optimizer = keras.optimizers.Adam(learning_rate=0.001)
    loss_fn = keras.losses.SparseCategoricalCrossentropy()
    
    # Métricas
    train_acc_metric = keras.metrics.SparseCategoricalAccuracy()
    val_acc_metric = keras.metrics.SparseCategoricalAccuracy()
    
    # Training loop
    for epoch in range(epochs):
        print(f"\nEpoch {epoch + 1}/{epochs}")
        
        # Training
        train_loss = []
        for step, (x_batch, y_batch) in enumerate(train_dataset):
            with tf.GradientTape() as tape:
                # Forward pass
                logits = model(x_batch, training=True)
                loss_value = loss_fn(y_batch, logits)
            
            # Backward pass
            grads = tape.gradient(loss_value, model.trainable_weights)
            optimizer.apply_gradients(zip(grads, model.trainable_weights))
            
            # Update metrics
            train_acc_metric.update_state(y_batch, logits)
            train_loss.append(float(loss_value))
            
            if step % 100 == 0:
                print(f"Step {step}: loss={loss_value:.4f}")
        
        # Validation
        val_loss = []
        for x_batch, y_batch in val_dataset:
            val_logits = model(x_batch, training=False)
            val_loss_value = loss_fn(y_batch, val_logits)
            val_acc_metric.update_state(y_batch, val_logits)
            val_loss.append(float(val_loss_value))
        
        # Print epoch results
        train_acc = train_acc_metric.result()
        val_acc = val_acc_metric.result()
        
        print(f"Training loss: {np.mean(train_loss):.4f}, acc: {train_acc:.4f}")
        print(f"Validation loss: {np.mean(val_loss):.4f}, acc: {val_acc:.4f}")
        
        # Reset metrics
        train_acc_metric.reset_states()
        val_acc_metric.reset_states()
    
    return model

def mixed_precision_training(model, dataset):
    """Training com mixed precision (FP16) para GPUs"""
    
    # Habilitar mixed precision
    policy = tf.keras.mixed_precision.Policy('mixed_float16')
    tf.keras.mixed_precision.set_global_policy(policy)
    
    # Loss scaling para estabilidade numérica
    optimizer = keras.optimizers.Adam()
    optimizer = tf.keras.mixed_precision.LossScaleOptimizer(optimizer)
    
    model.compile(
        optimizer=optimizer,
        loss='sparse_categorical_crossentropy',
        metrics=['accuracy']
    )
    
    return model.fit(dataset, epochs=10)
```

### Expert: Distributed Training com Strategy

```python
import tensorflow as tf
from tensorflow import keras

def distributed_training(train_dataset, val_dataset, num_gpus=2):
    """Distributed training em múltiplas GPUs"""
    
    # Criar estratégia de distribuição
    strategy = tf.distribute.MirroredStrategy()
    
    print(f"Number of devices: {strategy.num_replicas_in_sync}")
    
    # Criar modelo dentro do strategy scope
    with strategy.scope():
        model = keras.Sequential([
            keras.layers.Conv2D(32, 3, activation='relu', input_shape=(224, 224, 3)),
            keras.layers.MaxPooling2D(),
            keras.layers.Conv2D(64, 3, activation='relu'),
            keras.layers.MaxPooling2D(),
            keras.layers.Flatten(),
            keras.layers.Dense(128, activation='relu'),
            keras.layers.Dense(10, activation='softmax')
        ])
        
        model.compile(
            optimizer='adam',
            loss='sparse_categorical_crossentropy',
            metrics=['accuracy']
        )
    
    # Distribuir dataset
    dist_train_dataset = strategy.experimental_distribute_dataset(train_dataset)
    dist_val_dataset = strategy.experimental_distribute_dataset(val_dataset)
    
    # Treinar
    history = model.fit(
        dist_train_dataset,
        validation_data=dist_val_dataset,
        epochs=10
    )
    
    return model, history
```

## Templates por Caso de Uso

### Template: Simple Neural Network

```python
model = keras.Sequential([
    keras.layers.Dense(64, activation='relu', input_shape=({input_dim},)),
    keras.layers.Dense({num_classes}, activation='softmax')
])
model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])
model.fit(X_train, y_train, epochs=10, validation_split=0.2)
```

### Template: CNN

```python
model = keras.Sequential([
    keras.layers.Conv2D(32, (3,3), activation='relu', input_shape=({height},{width},3)),
    keras.layers.MaxPooling2D((2,2)),
    keras.layers.Conv2D(64, (3,3), activation='relu'),
    keras.layers.Flatten(),
    keras.layers.Dense({num_classes}, activation='softmax')
])
```

### Template: Transfer Learning

```python
base_model = keras.applications.{ModelName}(weights='imagenet', include_top=False)
base_model.trainable = False
model = keras.Sequential([base_model, keras.layers.GlobalAveragePooling2D(), keras.layers.Dense({num_classes})])
```

## Alternativas e Quando Usar

| Biblioteca | Quando Usar em Vez de TensorFlow |
|------------|-----------------------------------|
| PyTorch | Pesquisa acadêmica, prototipagem rápida, mais flexibilidade |
| JAX | Performance extrema, transformações funcionais, pesquisa |
| scikit-learn | ML clássico, não precisa deep learning |
| XGBoost/LightGBM | Dados tabulares, tree-based models |
| ONNX Runtime | Apenas inferência, cross-framework |
| TensorFlow Lite | Edge devices já com TF Lite (sem treino) |

## Requisitos do Sistema

- Python 3.8-3.11
- 64-bit system
- ~500MB-2GB espaço disco (depende da versão)
- Para GPU:
  - CUDA 11.8+ e cuDNN 8.6+
  - GPU NVIDIA com compute capability 3.5+
  - 8GB+ VRAM recomendado
- RAM: 8GB+ (16GB+ recomendado)

## Dependências

```
numpy>=1.23.5
six>=1.12.0
protobuf>=3.20.3
absl-py>=1.0.0
astunparse>=1.6.3
flatbuffers>=23.5.26
gast>=0.2.1
google-pasta>=0.2
grpcio>=1.48.2
h5py>=2.9.0
keras>=2.15.0
libclang>=13.0.0
opt-einsum>=2.3.2
packaging
tensorboard>=2.15
tensorflow-io-gcs-filesystem>=0.23.1
termcolor>=1.1.0
typing-extensions>=3.6.6
wrapt>=1.11.0
```

## Notas de Compatibilidade

- ✅ Windows 10+, Linux (Ubuntu 20.04+), macOS 10.15+
- ✅ x86_64 architecture
- ✅ ARM64 (macOS M1/M2 com metal acceleration)
- ✅ Python 3.8, 3.9, 3.10, 3.11
- ⚠️ Python 3.12: suporte experimental
- ⚠️ GPU requires CUDA 11.8+ and cuDNN 8.6+
- ⚠️ macOS GPU support via Metal (Apple Silicon only)
- ✅ CPU-only version works everywhere

## Troubleshooting Comum

### Problema: "Could not load dynamic library 'cudart64_*.dll'"

**Solução:** Instalar CUDA Toolkit
```bash
# Ou usar tensorflow[and-cuda] que inclui CUDA
pip install tensorflow[and-cuda]
```

### Problema: Out of Memory (OOM) na GPU

**Solução:** Limitar uso de memória GPU
```python
gpus = tf.config.list_physical_devices('GPU')
if gpus:
    tf.config.set_logical_device_configuration(
        gpus[0],
        [tf.config.LogicalDeviceConfiguration(memory_limit=4096)]  # 4GB
    )
```

### Problema: Training muito lento na CPU

**Solução:** Verificar se TensorFlow está usando GPU
```python
print("GPU Available:", tf.config.list_physical_devices('GPU'))
print("Built with CUDA:", tf.test.is_built_with_cuda())
```

### Problema: Model não salva corretamente

**Solução:** Usar SavedModel format
```python
# Salvar
model.save('my_model')  # SavedModel format

# Ou Keras format
model.save('my_model.keras')

# Carregar
model = keras.models.load_model('my_model')
```

### Problema: Incompatibilidade de versões

**Solução:** Usar versões compatíveis
```bash
# TF 2.15 requer Python 3.9-3.11
pip install tensorflow==2.15.0 keras==2.15.0
```

## Score de Seleção

```python
def calculate_tensorflow_score(task_keywords: list, context: dict) -> float:
    base_score = 0.70
    
    # Boost para deep learning
    if any(k in task_keywords for k in ['neural', 'deep', 'cnn', 'rnn', 'lstm', 'transformer']):
        base_score += 0.20
    
    # Boost para production deployment
    if any(k in task_keywords for k in ['production', 'serving', 'deploy', 'scale']):
        base_score += 0.15
    
    # Boost para computer vision
    if any(k in task_keywords for k in ['image', 'vision', 'detection', 'segmentation']):
        base_score += 0.10
    
    # Boost se GPU disponível
    if context.get('gpu_available'):
        base_score += 0.10
    
    # Penalty para ML clássico (use scikit-learn)
    if any(k in task_keywords for k in ['regression', 'classification']) and 'deep' not in str(task_keywords):
        base_score -= 0.20
    
    # Penalty para pesquisa (PyTorch pode ser melhor)
    if 'research' in task_keywords or 'prototype' in task_keywords:
        base_score -= 0.10
    
    return min(max(base_score, 0.0), 0.98)
```

## Production Deployment

### TensorFlow Serving
```bash
# Salvar modelo no formato SavedModel
model.save('my_model/1')

# Servir via Docker
docker run -p 8501:8501 \
  --mount type=bind,source=/path/to/my_model,target=/models/my_model \
  -e MODEL_NAME=my_model \
  tensorflow/serving
```

### TensorFlow Lite (Mobile/Edge)
```python
# Converter para TF Lite
converter = tf.lite.TFLiteConverter.from_keras_model(model)
converter.optimizations = [tf.lite.Optimize.DEFAULT]
tflite_model = converter.convert()

# Salvar
with open('model.tflite', 'wb') as f:
    f.write(tflite_model)
```

### TensorFlow.js (Browser)
```bash
# Converter para TF.js
tensorflowjs_converter \
    --input_format=keras \
    model.h5 \
    tfjs_model/
```

## Best Practices

1. **Use Keras API** para simplicidade
2. **Mixed Precision** para GPUs modernas (Tensor Cores)
3. **Data Pipeline** com `tf.data` para performance
4. **Checkpointing** para salvar progresso
5. **TensorBoard** para monitoramento
6. **Validation Set** sempre separado
7. **Early Stopping** para evitar overfitting
8. **Learning Rate Scheduling** para convergência
9. **Batch Normalization** para estabilidade
10. **SavedModel Format** para deployment

## Última Atualização

2025-01-15