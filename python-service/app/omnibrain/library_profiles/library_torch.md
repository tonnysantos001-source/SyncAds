# PyTorch (torch)

## Informações Básicas

- **Nome:** torch
- **Categoria:** Deep Learning, Neural Networks, Machine Learning
- **Versão Mínima:** 2.0.0
- **Versão Recomendada:** 2.1.0+
- **Licença:** BSD 3-Clause
- **Documentação:** https://pytorch.org/docs/

## Descrição

PyTorch é um framework de Deep Learning de código aberto desenvolvido pelo Meta AI. Oferece computação tensorial com forte aceleração GPU, diferenciação automática para construção de redes neurais, e uma API pythônica flexível. É a escolha preferida para pesquisa em ML e cada vez mais popular em produção.

## Casos de Uso Prioritários

1. **Redes Neurais Profundas** (confidence: 0.98)
2. **Transfer Learning** (confidence: 0.95)
3. **Computer Vision (CNNs)** (confidence: 0.95)
4. **NLP e Transformers** (confidence: 0.95)
5. **GANs e Modelos Generativos** (confidence: 0.93)
6. **Reinforcement Learning** (confidence: 0.90)
7. **Time Series com LSTMs** (confidence: 0.88)
8. **Custom Neural Architectures** (confidence: 0.95)

## Prós

- ✅ Diferenciação automática (autograd)
- ✅ API pythônica e intuitiva
- ✅ Dynamic computation graphs
- ✅ Aceleração GPU extremamente eficiente
- ✅ Ecossistema rico (torchvision, torchaudio, torchtext)
- ✅ Suporte TorchScript para produção
- ✅ Integração com ONNX
- ✅ Comunidade massiva e ativa
- ✅ Pesquisa de ponta usa PyTorch
- ✅ Debugging mais fácil que TensorFlow
- ✅ Mobile deployment (PyTorch Mobile)

## Contras

- ⚠️ Uso alto de memória GPU
- ⚠️ Requer CUDA para GPU (NVIDIA only)
- ⚠️ Instalação grande (~2GB com CUDA)
- ⚠️ Curva de aprendizado moderada
- ⚠️ Não tão otimizado para produção quanto TensorFlow Lite
- ⚠️ Serialização de modelos pode ser complexa

## Performance

- **Velocidade:** ⭐⭐⭐⭐⭐ (10/10 com GPU)
- **Uso de Memória:** ⭐⭐⭐ (6/10)
- **Qualidade de Output:** ⭐⭐⭐⭐⭐ (10/10)
- **Facilidade de Uso:** ⭐⭐⭐⭐ (8/10)

## Instalação

```bash
# CPU only
pip install torch torchvision torchaudio

# GPU (CUDA 11.8)
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118

# GPU (CUDA 12.1)
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
```

## Keywords/Triggers

- pytorch
- torch
- deep learning
- neural network
- cnn
- rnn
- lstm
- transformer
- gpu
- cuda
- transfer learning
- fine-tuning
- image classification
- object detection
- nlp
- gan
- autoencoder

## Exemplos de Código

### Básico: Tensor Operations e Autograd

```python
import torch

def tensor_operations():
    """Operações básicas com tensores"""
    # Criar tensores
    x = torch.tensor([[1, 2], [3, 4]], dtype=torch.float32)
    y = torch.randn(2, 2)
    
    # Operações
    z = x + y
    w = torch.matmul(x, y)
    
    # Autograd
    x.requires_grad = True
    y.requires_grad = True
    
    loss = (x * y).sum()
    loss.backward()
    
    return {
        'result': z.tolist(),
        'matmul': w.tolist(),
        'grad_x': x.grad.tolist(),
        'grad_y': y.grad.tolist()
    }
```

### Intermediário: Rede Neural Simples

```python
import torch
import torch.nn as nn
import torch.optim as optim

class SimpleNN(nn.Module):
    def __init__(self, input_size, hidden_size, num_classes):
        super(SimpleNN, self).__init__()
        self.fc1 = nn.Linear(input_size, hidden_size)
        self.relu = nn.ReLU()
        self.fc2 = nn.Linear(hidden_size, num_classes)
    
    def forward(self, x):
        out = self.fc1(x)
        out = self.relu(out)
        out = self.fc2(out)
        return out

def train_simple_model(X_train, y_train, epochs=100):
    """Treina modelo simples"""
    # Converter para tensores
    X = torch.FloatTensor(X_train)
    y = torch.LongTensor(y_train)
    
    # Criar modelo
    input_size = X.shape[1]
    hidden_size = 64
    num_classes = len(set(y_train))
    
    model = SimpleNN(input_size, hidden_size, num_classes)
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=0.001)
    
    # Treinar
    losses = []
    for epoch in range(epochs):
        optimizer.zero_grad()
        outputs = model(X)
        loss = criterion(outputs, y)
        loss.backward()
        optimizer.step()
        
        losses.append(loss.item())
        
        if (epoch + 1) % 10 == 0:
            print(f'Epoch [{epoch+1}/{epochs}], Loss: {loss.item():.4f}')
    
    return {
        'model': model,
        'final_loss': loss.item(),
        'losses': losses
    }
```

### Avançado: CNN para Classificação de Imagens

```python
import torch
import torch.nn as nn
import torch.optim as optim
from torchvision import datasets, transforms
from torch.utils.data import DataLoader

class ImageCNN(nn.Module):
    def __init__(self, num_classes=10):
        super(ImageCNN, self).__init__()
        self.conv1 = nn.Conv2d(3, 32, kernel_size=3, padding=1)
        self.conv2 = nn.Conv2d(32, 64, kernel_size=3, padding=1)
        self.conv3 = nn.Conv2d(64, 128, kernel_size=3, padding=1)
        
        self.pool = nn.MaxPool2d(2, 2)
        self.dropout = nn.Dropout(0.5)
        
        self.fc1 = nn.Linear(128 * 4 * 4, 512)
        self.fc2 = nn.Linear(512, num_classes)
        self.relu = nn.ReLU()
    
    def forward(self, x):
        x = self.pool(self.relu(self.conv1(x)))
        x = self.pool(self.relu(self.conv2(x)))
        x = self.pool(self.relu(self.conv3(x)))
        
        x = x.view(-1, 128 * 4 * 4)
        x = self.dropout(self.relu(self.fc1(x)))
        x = self.fc2(x)
        return x

def train_cnn(train_loader, val_loader, num_epochs=10, device='cuda'):
    """Treina CNN com validation"""
    model = ImageCNN(num_classes=10).to(device)
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=0.001)
    
    best_acc = 0.0
    history = {'train_loss': [], 'val_loss': [], 'val_acc': []}
    
    for epoch in range(num_epochs):
        # Training
        model.train()
        train_loss = 0.0
        
        for images, labels in train_loader:
            images, labels = images.to(device), labels.to(device)
            
            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()
            
            train_loss += loss.item()
        
        # Validation
        model.eval()
        val_loss = 0.0
        correct = 0
        total = 0
        
        with torch.no_grad():
            for images, labels in val_loader:
                images, labels = images.to(device), labels.to(device)
                outputs = model(images)
                loss = criterion(outputs, labels)
                val_loss += loss.item()
                
                _, predicted = torch.max(outputs.data, 1)
                total += labels.size(0)
                correct += (predicted == labels).sum().item()
        
        val_acc = 100 * correct / total
        
        history['train_loss'].append(train_loss / len(train_loader))
        history['val_loss'].append(val_loss / len(val_loader))
        history['val_acc'].append(val_acc)
        
        print(f'Epoch [{epoch+1}/{num_epochs}]')
        print(f'Train Loss: {train_loss/len(train_loader):.4f}')
        print(f'Val Loss: {val_loss/len(val_loader):.4f}, Val Acc: {val_acc:.2f}%')
        
        # Save best model
        if val_acc > best_acc:
            best_acc = val_acc
            torch.save(model.state_dict(), 'best_model.pth')
    
    return {
        'model': model,
        'best_accuracy': best_acc,
        'history': history
    }
```

### Expert: Transfer Learning com ResNet

```python
import torch
import torch.nn as nn
import torchvision.models as models
from torch.optim.lr_scheduler import ReduceLROnPlateau

def create_transfer_learning_model(num_classes, pretrained=True, freeze_base=True):
    """Cria modelo com transfer learning usando ResNet50"""
    # Carregar ResNet50 pré-treinado
    model = models.resnet50(pretrained=pretrained)
    
    # Congelar layers base se necessário
    if freeze_base:
        for param in model.parameters():
            param.requires_grad = False
    
    # Substituir última camada
    num_features = model.fc.in_features
    model.fc = nn.Sequential(
        nn.Linear(num_features, 512),
        nn.ReLU(),
        nn.Dropout(0.5),
        nn.Linear(512, num_classes)
    )
    
    return model

def fine_tune_model(model, train_loader, val_loader, num_epochs=20, device='cuda'):
    """Fine-tuning com learning rate scheduling"""
    model = model.to(device)
    
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.fc.parameters(), lr=0.001)
    scheduler = ReduceLROnPlateau(optimizer, mode='max', factor=0.1, patience=3)
    
    best_val_acc = 0.0
    
    for epoch in range(num_epochs):
        # Training phase
        model.train()
        train_loss = 0.0
        train_correct = 0
        train_total = 0
        
        for images, labels in train_loader:
            images, labels = images.to(device), labels.to(device)
            
            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()
            
            train_loss += loss.item()
            _, predicted = torch.max(outputs.data, 1)
            train_total += labels.size(0)
            train_correct += (predicted == labels).sum().item()
        
        train_acc = 100 * train_correct / train_total
        
        # Validation phase
        model.eval()
        val_loss = 0.0
        val_correct = 0
        val_total = 0
        
        with torch.no_grad():
            for images, labels in val_loader:
                images, labels = images.to(device), labels.to(device)
                outputs = model(images)
                loss = criterion(outputs, labels)
                
                val_loss += loss.item()
                _, predicted = torch.max(outputs.data, 1)
                val_total += labels.size(0)
                val_correct += (predicted == labels).sum().item()
        
        val_acc = 100 * val_correct / val_total
        
        # Learning rate scheduling
        scheduler.step(val_acc)
        
        print(f'Epoch [{epoch+1}/{num_epochs}]')
        print(f'Train Loss: {train_loss/len(train_loader):.4f}, Train Acc: {train_acc:.2f}%')
        print(f'Val Loss: {val_loss/len(val_loader):.4f}, Val Acc: {val_acc:.2f}%')
        print(f'LR: {optimizer.param_groups[0]["lr"]:.6f}')
        
        # Save best model
        if val_acc > best_val_acc:
            best_val_acc = val_acc
            torch.save({
                'epoch': epoch,
                'model_state_dict': model.state_dict(),
                'optimizer_state_dict': optimizer.state_dict(),
                'val_acc': val_acc,
            }, 'best_transfer_model.pth')
    
    return {
        'model': model,
        'best_val_acc': best_val_acc
    }
```

## Templates por Caso de Uso

### Template: Simple Inference

```python
import torch

model = torch.load('model.pth')
model.eval()

with torch.no_grad():
    input_tensor = torch.FloatTensor({input_data})
    output = model(input_tensor)
    prediction = torch.argmax(output, dim=1)
```

### Template: Training Loop

```python
import torch
import torch.nn as nn
import torch.optim as optim

model = MyModel()
criterion = nn.CrossEntropyLoss()
optimizer = optim.Adam(model.parameters(), lr=0.001)

for epoch in range(num_epochs):
    for data, target in dataloader:
        optimizer.zero_grad()
        output = model(data)
        loss = criterion(output, target)
        loss.backward()
        optimizer.step()
```

### Template: GPU Acceleration

```python
import torch

device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
model = MyModel().to(device)

for data, target in dataloader:
    data, target = data.to(device), target.to(device)
    output = model(data)
```

## Alternativas e Quando Usar

| Biblioteca | Quando Usar em Vez de PyTorch |
|------------|--------------------------------|
| TensorFlow | Produção em escala, TPUs, TensorFlow Lite mobile |
| JAX | Pesquisa numérica, transformações funcionais |
| MXNet | AWS deployment, Gluon API |
| scikit-learn | ML clássico, não precisa deep learning |
| FastAI | Prototipagem rápida, menos código |
| Keras | API mais simples, menos flexibilidade |

## Requisitos do Sistema

- Python 3.8+
- ~2GB espaço em disco (com CUDA)
- 8GB+ RAM
- GPU NVIDIA recomendada (CUDA)
- CUDA Toolkit (para GPU)
- cuDNN (para GPU)

## Dependências

```
numpy>=1.19.0
typing-extensions>=4.0.0
sympy
networkx
jinja2
fsspec
filelock
```

## Notas de Compatibilidade

- ✅ Windows, Linux, macOS
- ✅ x86_64, ARM64 (Apple Silicon M1/M2)
- ✅ Python 3.8-3.11
- ✅ CUDA 11.8, 12.1 (NVIDIA GPUs)
- ⚠️ AMD GPUs: suporte experimental via ROCm
- ⚠️ Metal (Apple): suporte beta

## Troubleshooting Comum

### Problema: CUDA out of memory

**Solução:** Reduzir batch size ou usar gradient accumulation
```python
# Reduzir batch size
batch_size = 16  # ao invés de 64

# Ou gradient accumulation
accumulation_steps = 4
for i, (data, target) in enumerate(dataloader):
    output = model(data)
    loss = criterion(output, target) / accumulation_steps
    loss.backward()
    
    if (i + 1) % accumulation_steps == 0:
        optimizer.step()
        optimizer.zero_grad()
```

### Problema: Modelo não treina (loss não diminui)

**Solução:** Verificar learning rate, normalização, gradientes
```python
# Learning rate muito alto
optimizer = optim.Adam(model.parameters(), lr=1e-4)  # Reduzir

# Verificar gradientes
for name, param in model.named_parameters():
    if param.grad is not None:
        print(f'{name}: {param.grad.norm()}')

# Normalizar inputs
from torchvision import transforms
transform = transforms.Compose([
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], 
                        std=[0.229, 0.224, 0.225])
])
```

### Problema: Overfitting

**Solução:** Regularização, dropout, data augmentation
```python
# Dropout
model.add_module('dropout', nn.Dropout(0.5))

# L2 Regularization
optimizer = optim.Adam(model.parameters(), lr=0.001, weight_decay=1e-4)

# Data Augmentation
transform = transforms.Compose([
    transforms.RandomHorizontalFlip(),
    transforms.RandomRotation(10),
    transforms.ColorJitter(brightness=0.2, contrast=0.2),
    transforms.ToTensor()
])
```

## Score de Seleção

```python
def calculate_pytorch_score(task_keywords: list) -> float:
    base_score = 0.70
    
    # Boost para deep learning
    if any(k in task_keywords for k in ['neural', 'deep', 'cnn', 'rnn', 'lstm', 'transformer']):
        base_score += 0.25
    
    # Boost se GPU disponível
    if torch.cuda.is_available():
        base_score += 0.10
    
    # Boost para computer vision
    if any(k in task_keywords for k in ['image', 'vision', 'detection', 'segmentation']):
        base_score += 0.10
    
    # Penalty para ML clássico
    if any(k in task_keywords for k in ['linear', 'logistic', 'tree', 'random_forest']):
        base_score -= 0.30
    
    return min(base_score, 0.98)
```

## Best Practices

### 1. Sempre mover para GPU se disponível
```python
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
model = model.to(device)
```

### 2. Usar DataLoader para batching
```python
from torch.utils.data import DataLoader
dataloader = DataLoader(dataset, batch_size=32, shuffle=True, num_workers=4)
```

### 3. Salvar checkpoints durante treino
```python
if epoch % 5 == 0:
    torch.save({
        'epoch': epoch,
        'model_state_dict': model.state_dict(),
        'optimizer_state_dict': optimizer.state_dict(),
        'loss': loss,
    }, f'checkpoint_epoch_{epoch}.pth')
```

### 4. Usar mixed precision para velocidade
```python
from torch.cuda.amp import autocast, GradScaler

scaler = GradScaler()

for data, target in dataloader:
    optimizer.zero_grad()
    
    with autocast():
        output = model(data)
        loss = criterion(output, target)
    
    scaler.scale(loss).backward()
    scaler.step(optimizer)
    scaler.update()
```

## Última Atualização

2025-01-15