// 1. Impor Firebase SDK dari CDN Google
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getFirestore, 
  collection, 
  getDocs, 
  addDoc, 
  deleteDoc, 
  doc, 
  updateDoc, 
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// 2. Konfigurasi Firebase (Masukkan data dari Firebase Console-mu)
const firebaseConfig = {
  apiKey: "AIzaSyBGPvYY8VQeF8s3IqyM12ELFJZ9XaaeWtQ",
  authDomain: "notfoundporto.firebaseapp.com",
  projectId: "notfoundporto",
  storageBucket: "notfoundporto.firebasestorage.app",
  messagingSenderId: "771934638191",
  appId: "1:771934638191:web:9057a5915934641406bd9a",
  measurementId: "G-2Y1C1Z2BNG"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ==================== 1. GET: Mengambil dan Menampilkan Data Project ====================
async function loadProjects() {
  try {
    const querySnapshot = await getDocs(collection(db, "projects"));
    const projectsContainer = document.getElementById("projects-container"); // Sesuaikan id elemen di HTML
    
    if (projectsContainer) {
      projectsContainer.innerHTML = "";
    }

    querySnapshot.forEach((documentSnap) => {
      const project = documentSnap.data();
      const projectId = documentSnap.id;

      // Ubah tools jika bentuknya string agar jadi array yang rapi
      const toolsArray = Array.isArray(project.tools) 
        ? project.tools 
        : (project.tools ? project.tools.split(",").map(t => t.trim()) : []);

      console.log(`${projectId} =>`, project);

      // Render ke HTML (opsional, sesuaikan dengan desain webmu)
      if (projectsContainer) {
        projectsContainer.innerHTML += `
          <div class="project-card" data-id="${projectId}">
            <h3>${project.title}</h3>
            <p>${project.description}</p>
            <p><strong>Tools:</strong> ${toolsArray.join(", ")}</p>
            ${project.repository_url ? `<a href="${project.repository_url}" target="_blank">Repository</a>` : ""}
            <button onclick="handleDelete('${projectId}')">Hapus</button>
          </div>
        `;
      }
    });
  } catch (error) {
    console.error("Gagal mengambil data project:", error);
  }
}

// ==================== 2. POST: Menambahkan Project Baru ====================
window.handleAddProject = async function(event) {
  event.preventDefault(); // Mencegah reload halaman jika dipakai di dalam form

  const title = document.getElementById("title-input").value;
  const description = document.getElementById("desc-input").value;
  const repository_url = document.getElementById("repo-input") ? document.getElementById("repo-input").value : "";
  const toolsInput = document.getElementById("tools-input").value;

  // Ubah tools jadi array
  const toolsArray = toolsInput.split(",").map(t => t.trim());

  try {
    await addDoc(collection(db, "projects"), {
      title,
      description,
      repository_url,
      tools: toolsArray,
      created_at: serverTimestamp()
    });

    alert("✅ Project berhasil ditambahkan!");
    loadProjects(); // Refresh tampilan data
  } catch (error) {
    console.error("Gagal menyimpan project:", error);
    alert("❌ Gagal menyimpan project");
  }
}

// ==================== 3. DELETE: Menghapus Project ====================
window.handleDelete = async function(id) {
  if (confirm("Yakin ingin menghapus project ini?")) {
    try {
      await deleteDoc(doc(db, "projects", id));
      alert("✅ Project berhasil dihapus!");
      loadProjects(); // Refresh tampilan data
    } catch (error) {
      console.error("Gagal menghapus project:", error);
      alert("❌ Gagal menghapus project");
    }
}
}

// ==================== 4. PUT: Mengupdate Project ====================
window.handleUpdate = async function(id, newTitle, newDesc, newRepo, newTools) {
  try {
    const toolsArray = Array.isArray(newTools) ? newTools : newTools.split(",").map(t => t.trim());
    const projectRef = doc(db, "projects", id);

    await updateDoc(projectRef, {
      title: newTitle,
      description: newDesc,
      repository_url: newRepo,
      tools: toolsArray
    });

    alert("✅ Project berhasil diperbarui!");
    loadProjects(); // Refresh tampilan data
  } catch (error) {
    console.error("Gagal mengupdate project:", error);
    alert("❌ Gagal mengupdate project");
  }
}

// Jalankan fungsi load data saat halaman web dibuka
loadProjects();
