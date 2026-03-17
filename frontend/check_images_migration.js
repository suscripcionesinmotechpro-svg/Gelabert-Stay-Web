
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function check() {
  const { data, error } = await supabase
    .from('properties')
    .select('title, main_image, gallery, status')
    .eq('status', 'publicada')
    .limit(5)

  if (error) {
    console.error('Error fetching properties:', error)
    return
  }

  if (data.length === 0) {
    console.log('No published properties found with ANON key. Trying all...')
    const { data: allData, error: allError } = await supabase
      .from('properties')
      .select('title, main_image, gallery, status')
      .limit(5)
      
    if (allError) {
      console.error('Error fetching any properties:', allError)
      return
    }
    console.log(`Found ${allData.length} total properties (unfiltered).`)
    printResults(allData)
  } else {
    printResults(data)
  }
}

function printResults(data) {
  console.log('Sample Properties Images:')
  data.forEach(p => {
    console.log(`- ${p.title} [${p.status}]:`)
    console.log(`  Main: ${p.main_image}`)
    if (p.gallery) {
      console.log(`  Gallery Count: ${p.gallery.length}`)
      console.log(`  Sample: ${p.gallery.slice(0, 1)}`)
    }
  })
}

check()
