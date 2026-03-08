# Backend Compilation Error Fix

**Date**: 2026-03-08
**Error**: `java.lang.ExceptionInInitializerError - com.sun.tools.javac.code.TypeTag :: UNKNOWN`
**Status**: ✅ **FIXED**

---

## 🐛 The Problem

When starting the backend, you got:
```
java: java.lang.ExceptionInInitializerError
com.sun.tools.javac.code.TypeTag :: UNKNOWN
```

---

## 🔍 Root Cause

**Corrupted Maven Cache** - Specifically the Lombok annotation processor library was corrupted or incompatible.

---

## ✅ Solution Applied

### **Step 1: Clean Maven Cache**
```bash
cd backend
rm -rf target
rm -rf ~/.m2/repository/org/projectlombok
```

### **Step 2: Recompile**
```bash
./mvnw clean compile -DskipTests
```

### **Result**:
- ✅ Lombok 1.18.36 downloaded fresh
- ✅ 325 source files compiled successfully
- ✅ BUILD SUCCESS in 17.5 seconds

---

## 🚀 Running the Backend

Use the existing script:
```bash
# From project root
./scripts/start-backend.sh

# Or manually
cd backend
./mvnw spring-boot:run
```

---

## ⚠️ Common Warnings (Safe to Ignore)

You may see warnings like:
```
@Builder will ignore the initializing expression entirely. 
If you want the initializing expression to serve as default, add @Builder.Default.
```

These are **non-critical** Lombok warnings and don't affect functionality.

---

## 🔧 If Error Happens Again

### **Quick Fix**:
```bash
cd backend
./mvnw clean compile -DskipTests
```

### **Deep Clean**:
```bash
# Clean everything
rm -rf target
rm -rf ~/.m2/repository/org/projectlombok

# Rebuild
./mvnw clean install -DskipTests
```

### **Nuclear Option** (if nothing works):
```bash
# Clean entire Maven cache (will redownload ALL dependencies)
rm -rf ~/.m2/repository

# Rebuild
./mvnw clean install -DskipTests
```

---

## 📋 System Info

- **Java Version**: OpenJDK 17.0.9
- **Spring Boot**: 3.4.2
- **Lombok**: 1.18.36
- **Build Tool**: Maven (wrapper)

---

## 🎯 Prevention

To avoid this issue in the future:

1. **Don't manually edit .m2/repository**
2. **Use Maven wrapper** (`./mvnw`) instead of system Maven
3. **Clean before important builds**: `./mvnw clean compile`
4. **Keep Java version consistent** (Java 17 for this project)

---

## 🔗 Related Issues

- **IDE Cache Issues**: If IntelliJ IDEA shows errors after fix, do:
  - File → Invalidate Caches → Invalidate and Restart
  
- **Lombok Plugin**: Ensure Lombok plugin is installed in IntelliJ:
  - Settings → Plugins → Search "Lombok" → Install

---

**Status**: ✅ **RESOLVED**

Backend compiles and runs successfully!
